import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import dayjs from 'dayjs'
import type { ImportRecord, ParseResult, ParseError } from '../types/import'

/**
 * 文件解析器接口
 */
export interface FileParser {
  parse(file: File): Promise<ParseResult>
  validate(data: any[]): ParseError[]
  transform(data: any[]): ImportRecord[]
}

/**
 * 基础文件解析器类
 */
export abstract class BaseFileParser implements FileParser {
  abstract parse(file: File): Promise<ParseResult>
  
  /**
   * 验证数据格式
   */
  validate(data: any[]): ParseError[] {
    const errors: ParseError[] = []
    
    if (!Array.isArray(data) || data.length === 0) {
      errors.push({
        row: 0,
        field: 'data',
        message: '文件内容为空或格式不正确'
      })
      return errors
    }

    data.forEach((row, index) => {
      const rowIndex = index + 1 // 从1开始计数（忽略表头）
      
      // 检查必填字段
      if (!row['日期'] && !row['Date'] && !row['date']) {
        errors.push({
          row: rowIndex,
          field: 'date',
          message: '缺少日期字段'
        })
      }

      if (!row['金额'] && !row['Amount'] && !row['amount'] && !row['Money']) {
        errors.push({
          row: rowIndex,
          field: 'amount',
          message: '缺少金额字段'
        })
      }

      // 验证日期格式
      const dateValue = row['日期'] || row['Date'] || row['date']
      if (dateValue) {
        const parsedDate = this.parseDate(dateValue)
        if (!parsedDate.isValid()) {
          errors.push({
            row: rowIndex,
            field: 'date',
            message: `无效的日期格式: ${dateValue}`
          })
        }
      }

      // 验证金额格式
      const amountValue = row['金额'] || row['Amount'] || row['amount'] || row['Money']
      if (amountValue) {
        const parsedAmount = this.parseAmount(amountValue)
        if (isNaN(parsedAmount)) {
          errors.push({
            row: rowIndex,
            field: 'amount',
            message: `无效的金额格式: ${amountValue}`
          })
        }
      }
    })

    return errors
  }

  /**
   * 转换数据格式
   */
  transform(data: any[]): ImportRecord[] {
    return data.map((row, index) => ({
      rowIndex: index + 1,
      date: this.parseDate(row['日期'] || row['Date'] || row['date']).toDate(),
      description: this.parseDescription(row),
      amount: this.parseAmount(row['金额'] || row['Amount'] || row['amount'] || row['Money']),
      category: this.parseCategory(row),
      direction: this.parseType(row),
      budget: this.parseBudget(row),
      tags: this.parseTags(row),
      notes: this.parseNote(row),
      originalData: row
    }))
  }

  /**
   * 解析日期
   */
  protected parseDate(dateValue: any): dayjs.Dayjs {
    if (!dateValue) return dayjs()

    // 如果是Excel日期数字
    if (typeof dateValue === 'number') {
      // Excel日期是从1900-01-01开始的天数（需要注意1900年闰年Bug）
      if (dateValue > 25569) { // 1970-01-01对应的Excel数字
        // 使用Excel的日期转换
        try {
          const date = XLSX.SSF.parse_date_code(dateValue)
          return dayjs(new Date(date.y, date.m - 1, date.d))
        } catch (error) {
          // 如果Excel日期解析失败，尝试Unix时间戳
          return dayjs.unix(dateValue)
        }
      } else {
        // 小数字可能是序列号，直接转换
        const excelEpoch = new Date(1900, 0, 1).getTime()
        const dayMs = 24 * 60 * 60 * 1000
        return dayjs(excelEpoch + (dateValue - 1) * dayMs)
      }
    }

    // 字符串日期
    if (typeof dateValue === 'string') {
      // 先尝试常见格式的严格解析
      const formats = [
        'YYYY-MM-DD',
        'YYYY/MM/DD',
        'YYYY-M-D',
        'YYYY/M/D',
        'MM/DD/YYYY',
        'M/D/YYYY',
        'DD/MM/YYYY',
        'D/M/YYYY',
        'YYYY年MM月DD日',
        'YYYY年M月D日',
        'MM月DD日',
        'M月D日'
      ]

      for (const format of formats) {
        const parsed = dayjs(dateValue, format, true) // 严格模式
        if (parsed.isValid()) {
          return parsed
        }
      }

      // 如果严格解析失败，使用智能解析
      const intelligentParsed = dayjs(dateValue)
      if (intelligentParsed.isValid()) {
        return intelligentParsed
      }
    }

    // Date对象
    if (dateValue instanceof Date) {
      return dayjs(dateValue)
    }

    // 默认返回当前日期
    console.warn('无法解析日期值:', dateValue)
    return dayjs()
  }

  /**
   * 解析金额
   */
  protected parseAmount(amountValue: any): number {
    if (typeof amountValue === 'number') {
      return Math.abs(amountValue) // 金额统一为正数，方向由type决定
    }

    if (typeof amountValue === 'string') {
      // 移除货币符号和分隔符
      const cleanAmount = amountValue
        .replace(/[¥$€£,\s]/g, '') // 移除常见货币符号和逗号
        .replace(/[（）()]/g, '') // 移除括号
        .trim()

      const parsed = parseFloat(cleanAmount)
      return isNaN(parsed) ? 0 : Math.abs(parsed)
    }

    return 0
  }

  /**
   * 解析描述信息
   */
  protected parseDescription(row: any): string {
    const fields = ['描述', 'Description', 'description', '备注', 'Note', 'note', '说明', '摘要', 'Summary']
    
    for (const field of fields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].trim()
      }
    }

    return ''
  }

  /**
   * 解析分类
   */
  protected parseCategory(row: any): string {
    const fields = ['分类', 'Category', 'category', '类别', '科目']
    
    for (const field of fields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].trim()
      }
    }

    return ''
  }

  /**
   * 解析交易类型
   */
  protected parseType(row: any): 'income' | 'expense' {
    const typeField = row['类型'] || row['Type'] || row['type'] || row['收支']
    const amountField = row['金额'] || row['Amount'] || row['amount'] || row['Money']
    const categoryField = row['分类'] || row['Category'] || row['category'] || row['类别']
    const descriptionField = row['描述'] || row['Description'] || row['description'] || row['备注'] || row['摘要']

    // 1. 根据类型字段判断
    if (typeField) {
      const typeStr = typeField.toString().toLowerCase()
      if (typeStr.includes('收入') || typeStr.includes('income') || typeStr.includes('进账')) {
        return 'income'
      }
      if (typeStr.includes('支出') || typeStr.includes('expense') || typeStr.includes('出账')) {
        return 'expense'
      }
    }

    // 2. 根据分类名称智能判断
    if (categoryField) {
      const categoryStr = categoryField.toString().toLowerCase()
      
      // 收入关键词
      const incomeKeywords = [
        '工资', '薪水', '薪资', '月薪', '年薪', '奖金', '津贴', '补助', '分红', '股息', '利息', '收益',
        '投资', '理财', '兼职', '外快', '收入', '进账', '报销', '退款', '返现', '返利',
        '红包', '礼金', '奖励', '佣金', '提成', '营收', '销售', '回款', '收款'
      ]
      
      for (const keyword of incomeKeywords) {
        if (categoryStr.includes(keyword)) {
          return 'income'
        }
      }
    }

    // 3. 根据描述智能判断
    if (descriptionField) {
      const descStr = descriptionField.toString().toLowerCase()
      
      // 收入关键词
      const incomeKeywords = [
        '工资', '薪水', '薪资', '月薪', '年薪', '奖金', '津贴', '补助', '分红', '股息', '利息',
        '投资收益', '理财收益', '兼职', '外快', '收入', '进账', '报销', '退款', '返现',
        '红包', '礼金', '奖励', '佣金', '提成', '营收', '销售收入', '回款'
      ]
      
      for (const keyword of incomeKeywords) {
        if (descStr.includes(keyword)) {
          return 'income'
        }
      }
    }

    // 4. 根据金额符号判断
    if (typeof amountField === 'number') {
      return amountField >= 0 ? 'expense' : 'income' // 注意：负数通常表示支出，正数可能是收入或支出
    }

    if (typeof amountField === 'string') {
      if (amountField.includes('-') || amountField.includes('（') || amountField.includes('(')) {
        return 'expense'
      }
    }

    // 默认为支出（大部分记录是支出）
    return 'expense'
  }

  /**
   * 解析标签
   */
  protected parseTags(row: any): string[] {
    const tagsField = row['标签'] || row['Tags'] || row['tags'] || row['Tag']
    
    if (!tagsField) return []

    if (typeof tagsField === 'string') {
      return tagsField
        .split(/[,，;；\s]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    }

    return []
  }

  /**
   * 解析预算
   */
  protected parseBudget(row: any): string {
    const fields = ['预算', 'Budget', 'budget', '成员', 'Member', 'member', '用户', 'User', 'user', '人员', '消费者']
    
    for (const field of fields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].trim()
      }
    }

    return ''
  }

  /**
   * 解析备注
   */
  protected parseNote(row: any): string {
    const fields = ['备注', 'Note', 'note', '说明', 'Remark', 'remark', '附加信息']
    
    for (const field of fields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].trim()
      }
    }

    return ''
  }
}

/**
 * Excel文件解析器
 */
export class ExcelParser extends BaseFileParser {
  async parse(file: File): Promise<ParseResult> {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        throw new Error('Excel文件中没有找到工作表')
      }

      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // 使用第一行作为header
        raw: true, // 保留原始格式，更好地处理日期
        blankrows: false // 忽略空行
      })

      if (jsonData.length < 2) {
        throw new Error('Excel文件内容不足，至少需要表头和一行数据')
      }

      // 第一行作为表头
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1)

      // 将数据转换为对象数组
      const objectData = dataRows.map(row => {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = (row as any[])[index]
        })
        return obj
      })

      // 验证数据
      const errors = this.validate(objectData)
      
      // 转换数据
      const records = this.transform(objectData)

      return {
        success: errors.length === 0,
        data: records,
        errors,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          totalRows: records.length,
          headers,
          sheetName
        }
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          field: 'file',
          message: `解析Excel文件失败: ${error instanceof Error ? error.message : '未知错误'}`
        }],
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          totalRows: 0
        }
      }
    }
  }
}

/**
 * CSV文件解析器
 */
export class CSVParser extends BaseFileParser {
  async parse(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              const errors = results.errors.map(error => ({
                row: error.row || 0,
                field: 'file',
                message: error.message
              }))

              resolve({
                success: false,
                data: [],
                errors,
                metadata: {
                  fileName: file.name,
                  fileSize: file.size,
                  totalRows: 0
                }
              })
              return
            }

            const objectData = results.data as any[]
            
            // 验证数据
            const validationErrors = this.validate(objectData)
            
            // 转换数据
            const records = this.transform(objectData)

            resolve({
              success: validationErrors.length === 0,
              data: records,
              errors: validationErrors,
              metadata: {
                fileName: file.name,
                fileSize: file.size,
                totalRows: records.length,
                headers: results.meta.fields || []
              }
            })
          } catch (error) {
            resolve({
              success: false,
              data: [],
              errors: [{
                row: 0,
                field: 'file',
                message: `解析CSV文件失败: ${error instanceof Error ? error.message : '未知错误'}`
              }],
              metadata: {
                fileName: file.name,
                fileSize: file.size,
                totalRows: 0
              }
            })
          }
        },
        error: (error) => {
          resolve({
            success: false,
            data: [],
            errors: [{
              row: 0,
              field: 'file',
              message: `读取CSV文件失败: ${error.message}`
            }],
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              totalRows: 0
            }
          })
        }
      })
    })
  }
}

/**
 * 文件解析器工厂
 */
export class FileParserFactory {
  static createParser(file: File): FileParser {
    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return new ExcelParser()
    }
    
    if (fileName.endsWith('.csv')) {
      return new CSVParser()
    }
    
    throw new Error(`不支持的文件格式: ${fileName}`)
  }

  static getSupportedFormats(): string[] {
    return ['.xlsx', '.xls', '.csv']
  }

  static isSupported(file: File): boolean {
    const fileName = file.name.toLowerCase()
    return this.getSupportedFormats().some(format => fileName.endsWith(format))
  }
}

// 导出便捷方法
export async function parseFile(file: File): Promise<ParseResult> {
  const parser = FileParserFactory.createParser(file)
  return parser.parse(file)
} 