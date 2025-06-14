import type { Category } from '../types/api'

/**
 * 分类匹配结果
 */
export interface MatchResult {
  categoryId: string
  categoryName: string
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'keyword' | 'phonetic'
  score: number
}

/**
 * 智能分类匹配器
 */
export class CategoryMatcher {
  private categories: Category[]
  private synonymMap: Map<string, string[]>
  private keywordMap: Map<string, string[]>
  private reverseSynonymMap: Map<string, string>

  constructor(categories: Category[]) {
    this.categories = categories
    this.synonymMap = this.buildSynonymMap()
    this.keywordMap = this.buildKeywordMap()
    this.reverseSynonymMap = this.buildReverseSynonymMap()
  }

  /**
   * 主要匹配方法
   */
  match(inputCategory: string, type: 'income' | 'expense'): MatchResult[] {
    const targetCategories = this.categories.filter(cat => 
      cat.type === (type === 'income' ? 'INCOME' : 'EXPENSE')
    )

    const results: MatchResult[] = []

    for (const category of targetCategories) {
      // 1. 精确匹配
      const exactScore = this.exactMatch(inputCategory, category.name)
      if (exactScore > 0) {
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          confidence: exactScore,
          matchType: 'exact',
          score: exactScore
        })
      }

      // 2. 模糊匹配（编辑距离）
      const fuzzyScore = this.fuzzyMatch(inputCategory, category.name)
      if (fuzzyScore > 0.5) {
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          confidence: fuzzyScore,
          matchType: 'fuzzy',
          score: fuzzyScore
        })
      }

      // 3. 语义匹配（同义词）
      const semanticScore = this.semanticMatch(inputCategory, category.name)
      if (semanticScore > 0.4) {
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          confidence: semanticScore,
          matchType: 'semantic',
          score: semanticScore
        })
      }

      // 4. 关键词匹配
      const keywordScore = this.keywordMatch(inputCategory, category.name)
      if (keywordScore > 0.3) {
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          confidence: keywordScore,
          matchType: 'keyword',
          score: keywordScore
        })
      }

      // 5. 拼音匹配
      const phoneticScore = this.phoneticMatch(inputCategory, category.name)
      if (phoneticScore > 0.6) {
        results.push({
          categoryId: category.id,
          categoryName: category.name,
          confidence: phoneticScore,
          matchType: 'phonetic',
          score: phoneticScore
        })
      }
    }

    // 合并重复分类的结果，取最高分
    const merged = this.mergeResults(results)
    
    // 按置信度排序
    return merged.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * 获取最佳匹配
   */
  getBestMatch(inputCategory: string, type: 'income' | 'expense'): MatchResult | null {
    const results = this.match(inputCategory, type)
    return results.length > 0 ? results[0] : null
  }

  /**
   * 1. 精确匹配
   */
  private exactMatch(input: string, target: string): number {
    const inputNorm = this.normalize(input)
    const targetNorm = this.normalize(target)
    
    if (inputNorm === targetNorm) return 1.0
    if (inputNorm.includes(targetNorm) || targetNorm.includes(inputNorm)) return 0.9
    return 0
  }

  /**
   * 2. 模糊匹配（基于编辑距离）
   */
  private fuzzyMatch(input: string, target: string): number {
    const inputNorm = this.normalize(input)
    const targetNorm = this.normalize(target)
    
    const distance = this.levenshteinDistance(inputNorm, targetNorm)
    const maxLength = Math.max(inputNorm.length, targetNorm.length)
    
    if (maxLength === 0) return 0
    return Math.max(0, 1 - distance / maxLength)
  }

  /**
   * 3. 语义匹配（同义词）
   */
  private semanticMatch(input: string, target: string): number {
    const inputNorm = this.normalize(input)
    const targetNorm = this.normalize(target)
    
    // 方式1：检查输入词是否是目标分类的同义词
    const synonyms = this.synonymMap.get(targetNorm) || []
    if (synonyms.includes(inputNorm)) return 0.95
    
    // 方式2：使用反向索引，检查输入词是否映射到某个系统分类
    const mappedCategory = this.reverseSynonymMap.get(inputNorm)
    if (mappedCategory === targetNorm) return 0.95
    
    // 方式3：检查部分匹配
    for (const synonym of synonyms) {
      if (inputNorm.includes(synonym) || synonym.includes(inputNorm)) {
        return 0.8
      }
    }
    
    // 方式4：检查反向部分匹配
    for (const [synonymWord, categoryName] of this.reverseSynonymMap.entries()) {
      if (categoryName === targetNorm && (inputNorm.includes(synonymWord) || synonymWord.includes(inputNorm))) {
        return 0.7
      }
    }
    
    return 0
  }

  /**
   * 4. 关键词匹配
   */
  private keywordMatch(input: string, target: string): number {
    const inputNorm = this.normalize(input)
    const keywords = this.keywordMap.get(target) || []
    
    let maxScore = 0
    for (const keyword of keywords) {
      if (inputNorm.includes(keyword)) {
        const score = Math.min(keyword.length / inputNorm.length * 1.2, 0.9)
        maxScore = Math.max(maxScore, score)
      }
    }
    
    return maxScore
  }

  /**
   * 5. 拼音匹配（简化版）
   */
  private phoneticMatch(input: string, target: string): number {
    // 简化的拼音匹配，主要检查首字母
    const inputPinyin = this.getSimplePinyin(input)
    const targetPinyin = this.getSimplePinyin(target)
    
    if (inputPinyin === targetPinyin) return 0.85
    if (inputPinyin.startsWith(targetPinyin) || targetPinyin.startsWith(inputPinyin)) return 0.7
    
    return 0
  }

  /**
   * 合并重复结果
   */
  private mergeResults(results: MatchResult[]): MatchResult[] {
    const merged = new Map<string, MatchResult>()
    
    for (const result of results) {
      const existing = merged.get(result.categoryId)
      if (!existing || result.confidence > existing.confidence) {
        merged.set(result.categoryId, result)
      }
    }
    
    return Array.from(merged.values())
  }

  /**
   * 文本标准化
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]/g, '') // 只保留中文、英文、数字
      .trim()
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0))

    for (let i = 0; i <= len1; i++) matrix[i][0] = i
    for (let j = 0; j <= len2; j++) matrix[0][j] = j

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // 删除
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j - 1] + cost // 替换
        )
      }
    }

    return matrix[len1][len2]
  }

  /**
   * 简化拼音转换
   */
  private getSimplePinyin(text: string): string {
    const pinyinMap: Record<string, string> = {
      // 基础分类相关
      '餐': 'can', '饮': 'yin', '吃': 'chi', '饭': 'fan', '食': 'shi',
      '交': 'jiao', '通': 'tong', '车': 'che', '铁': 'tie', '公': 'gong',
      '购': 'gou', '物': 'wu', '买': 'mai', '商': 'shang', '店': 'dian',
      '娱': 'yu', '乐': 'le', '玩': 'wan', '游': 'you', '戏': 'xi',
      '工': 'gong', '资': 'zi', '薪': 'xin', '钱': 'qian', '收': 'shou',
      '运': 'yun', '动': 'dong', '健': 'jian', '身': 'shen', '体': 'ti',
      '医': 'yi', '疗': 'liao', '院': 'yuan', '药': 'yao', '病': 'bing',
      '早': 'zao', '超': 'chao', '市': 'shi',
      
      // 新增分类相关拼音（只添加未重复的字符）
      '兼': 'jian', '职': 'zhi', '临': 'lin', '副': 'fu', '业': 'ye',
      '日': 'ri', '用': 'yong', '生': 'sheng', '活': 'huo', '品': 'pin',
      '财': 'cai', '投': 'tou', '基': 'ji', '股': 'gu', '票': 'piao',
      '奖': 'jiang', '终': 'zhong', '季': 'ji', '度': 'du', '月': 'yue',
      '提': 'ti', '成': 'cheng', '佣': 'yong2', '回': 'hui', '扣': 'kou',
      '其': 'qi', '他': 'ta', '杂': 'za', '项': 'xiang', '未': 'wei', '分': 'fen', '类': 'lei',
      '饰': 'shi2', '衣': 'yi', '鞋': 'xie', '包': 'bao', '装': 'zhuang',
      '美': 'mei', '容': 'rong', '护': 'hu', '肤': 'fu3', '妆': 'zhuang2',
      '居': 'ju', '家': 'jia', '具': 'ju2', '布': 'bu', '置': 'zhi',
      '孩': 'hai', '子': 'zi', '儿': 'er', '童': 'tong', '小': 'xiao', '宝': 'bao2',
      '长': 'zhang', '辈': 'bei', '父': 'fu4', '母': 'mu', '爸': 'ba', '妈': 'ma', '老': 'lao', '人': 'ren',
      '社': 'she', '聚': 'ju3', '会': 'hui2', '朋': 'peng', '友': 'you', '礼': 'li2',
      '旅': 'lv', '行': 'xing', '假': 'jia', '机': 'ji2', '酒': 'jiu',
      '数': 'shu', '码': 'ma', '手': 'shou', '脑': 'nao', '科': 'ke', '技': 'ji3',
      '汽': 'qi2', '贷': 'dai', '养': 'yang', '维': 'wei',
      '还': 'huan', '款': 'kuan', '期': 'qi3', '信': 'xin', '卡': 'ka', '债': 'zhai',
      '险': 'xian', '费': 'fei', '赔': 'pei',
      '学': 'xue', '习': 'xi', '育': 'yu', '培': 'pei2', '训': 'xun', '课': 'ke2', '程': 'cheng', '书': 'shu',
      '办': 'ban', '文': 'wen', '印': 'yin', '议': 'yi2', '务': 'wu',
      '件': 'jian2',
      '利': 'li3', '息': 'xi2', '益': 'yi3', '报': 'bao3', '红': 'hong',
      '房': 'fang', '租': 'zu', '住': 'zhu', '宿': 'su'
    }
    
    return text.split('').map(char => pinyinMap[char] || char).join('')
  }

  /**
   * 构建同义词映射 - 全面覆盖所有分类
   */
  private buildSynonymMap(): Map<string, string[]> {
    const synonyms = new Map<string, string[]>()
    
    // 餐饮相关
    synonyms.set('餐饮', [
      // 基本用餐
      '吃饭', '饭店', '食物', '用餐', '就餐', '聚餐', '外食',
      // 具体餐次
      '午餐', '晚餐', '早餐', '早饭', '中饭', '晚饭', '夜宵', '宵夜', '加餐',
      // 餐厅类型
      '餐厅', '酒店', '食堂', '快餐', '外卖', '烧烤', '火锅', '自助餐',
      // 食物类型
      '小食', '零食', '点心', '甜品', '饮料', '茶水', '咖啡', '奶茶',
      // 动作词
      '吃', '喝', '品尝', '用膳'
    ])
    
    // 购物相关
    synonyms.set('购物', [
      // 基本购物
      '买东西', '买东', '消费', '采购', '购买', '血拼', '剁手', '网购', '逛街',
      // 购物场所
      '商场', '超市', '便利店', '市场', '商店', '专柜', '门店', '商城',
      // 购物平台
      '淘宝', '京东', '天猫', '拼多多', '苏宁', '网店', '代购',
      // 购物行为
      '买', '购', '选购', '下单', '支付', '结账', '消费'
    ])
    
    // 交通相关
    synonyms.set('交通', [
      '出行', '通勤', '公交', '地铁', '打车', '出租车', '滴滴', '车费', '油费', '停车',
      '公共交通', '轨道交通', '网约车', '租车', '自驾', '叫车',
      '地铁卡', '公交卡', '充值', '月票', '车票'
    ])
    
    // 娱乐相关
    synonyms.set('娱乐', [
      '玩乐', '休闲', '放松', '消遣', '游戏', '电影', 'KTV', '酒吧', '旅游', '景点',
      '娱乐活动', '休闲娱乐', '玩', '乐', '看电影', '唱歌', '游玩',
      '度假', '旅行', '观光', '游览'
    ])
    
    // 工资收入相关
    synonyms.set('工资', [
      '薪水', '薪资', '月薪', '年薪', '收入', '报酬', '酬劳', '工钱', '底薪',
      '奖金', '津贴', '提成', '分红', '补贴', '福利', '绩效'
    ])
    
    // 运动相关
    synonyms.set('运动', [
      '健身', '锻炼', '体育', '健身房', '游泳', '跑步', '球类', '瑜伽', '健身卡',
      '运动', '体育运动', '健身活动', '体育锻炼', '体能训练'
    ])
    
    // 医疗相关
    synonyms.set('医疗', [
      '看病', '就医', '治疗', '体检', '挂号', '药费', '医药', '健康', '诊疗',
      '医院', '诊所', '门诊', '住院', '手术', '检查', '化验'
    ])
    
    // 通讯相关
    synonyms.set('通讯', [
      '话费', '流量', '网费', '宽带', '手机费', '电话费', '上网', '通信',
      '电信', '移动', '联通', '充话费', '续费'
    ])
    
    // 日用相关
    synonyms.set('日用', [
      '生活用品', '日常用品', '家居', '洗护', '清洁', '卫生', '个护',
      '日用品', '生活必需品', '家庭用品', '清洁用品', '日常', '生活',
      '洗发水', '牙膏', '纸巾', '洗衣液', '洗洁精'
    ])
    
    // === 新增分类匹配 ===
    
    // 兼职相关
    synonyms.set('兼职', [
      '打工', '临时工', '小时工', '副业', '外快', '零工', '临时', '兼差',
      '代驾', '外卖员', '家教', '钟点工', '客服', '推广', '业务',
      'part-time', 'parttime'
    ])
    
    // 理财相关
    synonyms.set('理财', [
      '投资', '基金', '股票', '债券', '定期', '存款', '银行', '证券',
      '保本', '收益', '分红', '股息', '理财产品', '财富管理',
      '余额宝', '支付宝', '微信理财', '银行理财', '基金定投',
      'investment', '炒股', '买基金'
    ])
    
    // 奖金相关
    synonyms.set('奖金', [
      '年终奖', '季度奖', '月奖', '绩效奖', '业绩奖', '全勤奖',
      '项目奖', '创新奖', '优秀奖', '激励', '红包', '过节费',
      'bonus', '奖励', '嘉奖'
    ])
    
    // 提成相关
    synonyms.set('提成', [
      '佣金', '回扣', '销售提成', '业务提成', '代理费', '中介费',
      '推荐费', '返佣', '抽成', 'commission', '分成', '业绩提成'
    ])
    
    // 其他相关
    synonyms.set('其他', [
      '杂项', '未分类', '零散', '临时', '意外', '不明', '杂费',
      '其它', '别的', '额外', 'other', '其他支出', '其他收入'
    ])
    
    // 服饰相关
    synonyms.set('服饰', [
      '衣服', '鞋子', '包包', '配饰', '穿搭', '时装', '潮流', '品牌',
      '上衣', '裤子', '裙子', '外套', '内衣', '袜子', '帽子', '围巾',
      '手表', '首饰', '珠宝', '眼镜', 'clothing', '服装', '时尚'
    ])
    
    // 美容相关
    synonyms.set('美容', [
      '护肤', '化妆', '美妆', '保养', '美发', '造型', 'SPA', '美甲',
      '面膜', '精华', '乳液', '防晒', '粉底', '口红', '眉毛', '睫毛',
      '理发', '染发', '烫发', '按摩', '美容院', 'beauty', '护理'
    ])
    
    // 居家相关
    synonyms.set('居家', [
      '家具', '家电', '装修', '装饰', '布置', '收纳', '整理',
      '沙发', '床', '桌子', '椅子', '柜子', '冰箱', '洗衣机', '电视',
      '窗帘', '地毯', '灯具', '餐具', '厨具', 'home', '家庭', '家居用品'
    ])
    
    // 孩子相关
    synonyms.set('孩子', [
      '儿童', '小孩', '宝宝', '婴儿', '幼儿', '学生', '孩童',
      '玩具', '童装', '奶粉', '尿布', '儿童用品', '母婴',
      '学费', '培训班', '兴趣班', '辅导', 'child', '小朋友', '子女'
    ])
    
    // 长辈相关
    synonyms.set('长辈', [
      '父母', '爸妈', '老人', '爷爷', '奶奶', '外公', '外婆',
      '养老', '赡养', '孝敬', '老年', '退休', '保健品',
      'elder', '长者', '老年人', '家人', '亲人'
    ])
    
    // 社交相关
    synonyms.set('社交', [
      '聚会', '聚餐', '朋友', '同事', '社团', '活动', '派对',
      '礼品', '礼物', '红包', '份子钱', '婚礼', '生日', '节日',
      'social', '社会', '人际', '交际', '聚会费'
    ])
    
    // 旅行相关  
    synonyms.set('旅行', [
      '旅游', '出游', '度假', '出差', '机票', '酒店', '住宿',
      '景点', '门票', '导游', '租车', '签证', '保险',
      'travel', '旅程', '游玩', '观光', '自由行', '跟团'
    ])
    
    // 数码相关
    synonyms.set('数码', [
      '电子产品', '手机', '电脑', '平板', '相机', '耳机', '充电器',
      '数据线', '键盘', '鼠标', '音响', '投影仪', '路由器',
      'digital', '科技', '数码产品', '电子设备', '智能设备'
    ])
    
    // 汽车相关
    synonyms.set('汽车', [
      '车', '买车', '车贷', '保险', '保养', '维修', '加油', '停车',
      '洗车', '年检', '违章', '过路费', '汽车用品',
      'car', '车辆', '轿车', 'SUV', '新车', '二手车'
    ])
    
    // 还款相关
    synonyms.set('还款', [
      '还贷', '贷款', '分期', '信用卡', '房贷', '车贷', '消费贷',
      '借款', '欠款', '债务', '利息', '本金', '月供',
      'repayment', '偿还', '还钱', '还债'
    ])
    
    // 保险相关
    synonyms.set('保险', [
      '保费', '投保', '理赔', '社保', '医保', '养老保险', '意外险',
      '重疾险', '车险', '财产险', '人寿险', '健康险',
      'insurance', '保障', '投保费', '续保'
    ])
    
    // 学习相关
    synonyms.set('学习', [
      '教育', '培训', '课程', '书籍', '学费', '培训费', '辅导',
      '考试', '证书', '技能', '知识', '在线课程', '网课',
      'education', '教学', '学校', '大学', '研究生', '进修'
    ])
    
    // 办公相关
    synonyms.set('办公', [
      '办公用品', '文具', '打印', '复印', '纸张', '笔', '本子',
      '办公设备', '电脑', '软件', '会议', '商务', '工作',
      'office', '办公室', '公司', '企业', '商业'
    ])
    
    // 维修相关
    synonyms.set('维修', [
      '修理', '保养', '检修', '更换', '配件', '零件', '服务',
      '手机维修', '电脑维修', '家电维修', '汽车维修',
      'repair', '修复', '维护', '故障', '售后'
    ])
    
    // 利息相关
    synonyms.set('利息', [
      '息费', '收益', '回报', '分红', '股息', '定期利息',
      '存款利息', '贷款利息', '投资收益', '理财收益',
      'interest', '利润', '收入', '被动收入'
    ])
    
    // 住房相关（扩展）
    synonyms.set('住房', [
      '房租', '房费', '租金', '房屋', '住宿', '宿舍', '公寓', '小区',
      '物业费', '水电费', '燃气费', '暖气费', '网费', '有线电视',
      '房贷', '首付', '中介费', '押金', '装修', 'home', '居住'
    ])
    
    return synonyms
  }

  /**
   * 构建反向同义词索引
   */
  private buildReverseSynonymMap(): Map<string, string> {
    const reverseMap = new Map<string, string>()
    
    for (const [categoryName, synonyms] of this.synonymMap.entries()) {
      for (const synonym of synonyms) {
        const normalizedSynonym = this.normalize(synonym)
        const normalizedCategory = this.normalize(categoryName)
        reverseMap.set(normalizedSynonym, normalizedCategory)
      }
    }
    
    return reverseMap
  }

  /**
   * 构建关键词映射 - 全面扩展版
   */
  private buildKeywordMap(): Map<string, string[]> {
    const keywords = new Map<string, string[]>()
    
    // 基础分类关键词
    keywords.set('餐饮', ['吃', '饭', '餐', '食', '喝', '茶', '咖啡', '酒', '菜', '肉', '汤', '面', '粥', '早'])
    keywords.set('交通', ['车', '铁', '机', '船', '路', '站', '票', '油', '停'])
    keywords.set('购物', ['买', '购', '商', '市', '店', '货', '品', '物', '超'])
    keywords.set('娱乐', ['玩', '乐', '游', '戏', '影', '音', '唱', '舞'])
    keywords.set('工资', ['工', '资', '薪', '酬', '收', '入', '钱'])
    keywords.set('运动', ['健', '身', '动', '跑', '游', '球', '操'])
    keywords.set('医疗', ['医', '病', '药', '院', '诊', '疗', '检', '健康'])
    keywords.set('通讯', ['话', '网', '流', '信', '通', '讯', '费'])
    keywords.set('住房', ['房', '租', '住', '宿'])
    keywords.set('美容', ['美', '容', '护', '肤', '妆'])
    
    // 新增分类关键词
    keywords.set('兼职', ['兼', '职', '工', '临', '时', '副', '业', '外', '快'])
    keywords.set('日用', ['日', '用', '生', '活', '品', '洗', '护', '清', '洁'])
    keywords.set('理财', ['理', '财', '投', '资', '基', '金', '股', '票', '存', '款'])
    keywords.set('奖金', ['奖', '金', '年', '终', '季', '度', '月', '红', '包'])
    keywords.set('提成', ['提', '成', '佣', '金', '回', '扣', '业', '绩'])
    keywords.set('其他', ['其', '他', '杂', '项', '未', '分', '类'])
    keywords.set('服饰', ['衣', '服', '鞋', '包', '饰', '装', '搭', '时', '尚'])
    keywords.set('居家', ['家', '具', '电', '装', '修', '布', '置', '收', '纳'])
    keywords.set('孩子', ['孩', '子', '儿', '童', '小', '孩', '宝', '宝', '玩', '具'])
    keywords.set('长辈', ['长', '辈', '父', '母', '爸', '妈', '老', '人', '养', '老'])
    keywords.set('社交', ['社', '交', '聚', '会', '朋', '友', '礼', '物', '红', '包'])
    keywords.set('旅行', ['旅', '行', '游', '度', '假', '机', '票', '酒', '店'])
    keywords.set('数码', ['数', '码', '电', '子', '手', '机', '脑', '科', '技'])
    keywords.set('汽车', ['汽', '车', '买', '贷', '油', '保', '养', '维', '修'])
    keywords.set('还款', ['还', '款', '贷', '分', '期', '信', '用', '卡', '债'])
    keywords.set('保险', ['保', '险', '费', '投', '保', '理', '赔', '社', '医'])
    keywords.set('学习', ['学', '习', '教', '育', '培', '训', '课', '程', '书'])
    keywords.set('办公', ['办', '公', '文', '具', '打', '印', '会', '议', '商', '务'])
    keywords.set('维修', ['维', '修', '理', '保', '养', '配', '件', '服', '务'])
    keywords.set('利息', ['利', '息', '收', '益', '回', '报', '分', '红', '股', '息'])
    
    return keywords
  }
}

/**
 * 创建分类匹配器实例
 */
export function createCategoryMatcher(categories: Category[]): CategoryMatcher {
  return new CategoryMatcher(categories)
}

/**
 * 快速匹配单个分类
 */
export function quickMatch(
  inputCategory: string, 
  type: 'income' | 'expense', 
  categories: Category[]
): MatchResult | null {
  const matcher = new CategoryMatcher(categories)
  return matcher.getBestMatch(inputCategory, type)
} 