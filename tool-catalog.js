/* Public tool metadata only. User media, keys and working records stay in each tool. */
window.CREATIVE_TOOLS = [
  {
    id: 'science', name: '科普工作台', category: '选题与脚本', mode: 'online', badge: '在线使用', color: 'lime', icon: 'science',
    summary: '从观众的问题，走到能开拍的分镜。',
    detail: '把评论问题、资料依据、文案和分镜放到同一条工作流里。',
    url: 'https://science-evidence-studio.liu2026liu123.chatgpt.site/?view=inbox',
    features: ['观众问题池', '依据与条件', '文案证据对照', '分镜工作台', '开拍检查'],
    note: '已有项目保存在原工具的浏览器空间。采集评论或找不到原来的记录时，请用「独立打开」。'
  },
  {
    id: 'batch', name: '拾片', category: '素材收集', mode: 'hybrid', badge: 'Mac 本机版', color: 'peach', icon: 'batch',
    summary: '把三个平台的灵感，收进素材库。',
    detail: '批量整理 B站、抖音、小红书链接，在电脑上解析、预览和保存有权使用的素材。',
    url: 'https://science-evidence-studio.liu2026liu123.chatgpt.site/tools/batch/',
    local: 'http://127.0.0.1:4988/', launcher: '启动拾片.command',
    download: 'https://science-evidence-studio.liu2026liu123.chatgpt.site/downloads/shupian-mac.zip',
    features: ['批量链接', '素材预览', '打包下载', '拖入剪映'],
    note: '这里展示在线预览。真实解析和下载请打开 Mac 本机版，文件与任务记录留在电脑里。'
  },
  {
    id: 'voice', name: '声样', category: '旁白配音', mode: 'local', badge: '本机启动', color: 'violet', icon: 'voice',
    summary: '让文案，成为自己的声音。',
    detail: '用已配置的音色生成旁白，先核对读法，再试听和导出音频。',
    local: 'http://127.0.0.1:48217/', launcher: '启动声音克隆器.command',
    features: ['文字配音', '读法预览', '对比试听', 'MP3 / WAV'],
    steps: ['输入文案，选择已配置的音色。', '预览读法，生成后逐段试听。', '下载音频，用作剪辑助手的旁白。'],
    note: '需要这台 Mac 上已配置的声音克隆器。生成时文案与参考录音会由 Fish Audio 处理，可能按所选模型计费。'
  },
  {
    id: 'editor', name: '剪辑助手', category: '剪辑与包装', mode: 'local', badge: '本机启动', color: 'blue', icon: 'editor',
    summary: '文案、旁白、素材，一起交给剪辑。',
    detail: '把剪气口、按文案编排和 Eagle 风格参考接成一条制作流程。',
    local: 'http://127.0.0.1:4190/', launcher: '启动剪辑助手.command',
    features: ['剪气口', '字幕对齐', 'Eagle 参考', '视频导出'],
    steps: ['放入文案、旁白和视频素材。', '点击「开始制作」，串联剪辑与包装。', '在本机预览成片，再保存导出。'],
    note: '需要本机剪辑助手和 Eagle。导出文件留在电脑的「剪辑助手 / exports」，不上传个人网站；成片仍需人工审看。'
  },
  {
    id: 'motion', name: '动效镜头库', category: '画面动效', mode: 'online', badge: '在线使用', color: 'pink', icon: 'motion',
    summary: '把喜欢的镜头节奏，拆开来调。',
    detail: '五个可调整的镜头动效，支持慢放、逐帧和前后对比。',
    url: 'https://ljw1234789.github.io/moto-motion-lab/',
    features: ['标题冲入', '机械标注', '甩镜转场', '速度线', 'Logo 扫光'],
    note: '可直接预览与调整动效参数。自选图片在当前浏览器中使用。'
  },
  {
    id: 'photo', name: '取景', category: '摄影练习', mode: 'hybrid-online', badge: '网页 + 本机 AI', color: 'sand', icon: 'photo',
    summary: '看懂一张照片，练好下一张。',
    detail: '从照片点评、专项练习到重拍对比，积累自己的摄影成长档案。',
    url: 'https://ljw1234789.github.io/photo-coach/',
    features: ['照片点评', '参考图学习', '专项练习', '重拍对比'],
    note: '网页可体验演示；真实 AI 点评需配置自己的私人档案服务，并启动 Mac 本地助手。'
  }
];
