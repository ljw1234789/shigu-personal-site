/* A small, shared selection for the portfolio and the 3D desk.
   Links point to the complete source archive; research is separate from production credits. */
window.PORTFOLIO_RESEARCH = {
  accounts: [
    {
      id: 'bidao', name: '毕导', label: 'IP 与科普内容研究',
      cover: 'research/evidence/3aecd69e4b75689827dad640.webp',
      question: '怎样让一个问题，值得一直看下去？',
      summary: '从生活疑问、解释与验证，到评论反馈，拆解科普内容如何组织叙事和依据。',
      count: '10', unit: '条历史样本',
      scope: '完整 IP 报告 · 2026.10.11 样本快照',
      observations: [
        { title: '选题：让疑问先成立', text: '量筒、盘子、足球都从熟悉的物件切入。先找到观众会答、也可能答错的问题，再安排解释。' },
        { title: '脚本：解释要有落点', text: '把疑问、解释、可见现象和适用条件对应起来，画面承担验证，而不只是装饰旁白。' },
        { title: '复盘：回到具体反馈', text: '把可见互动数与评论原文一起看，区分观众的疑问和情绪；历史样本不直接推出增长因果。' }
      ],
      links: [
        { label: '完整 IP 报告', url: 'research/bidao/report/' },
        { label: '10 条历史样本', url: 'research/view.html?id=798439875aa8317a' },
        { label: '精选公开视频', url: 'research/#participation' }
      ],
      boundary: '账号内容研究；本次精选公开视频另列；个人一般职责在介绍中说明。'
    },
    {
      id: 'yingjun', name: '英俊姐妹日记', label: '数码内容与拍剪研究', focalY: .25,
      cover: 'research/evidence/a43f169b78ca09ba61606c4d.webp',
      question: '怎样把一个功能，讲成观众会用的内容？',
      summary: '研究公开作品的内容任务、脚本结构和画面证据，再把观察整理为可执行的拍剪判断。',
      count: '74', unit: '条作品结构研究',
      scope: '账号总册 · 逐条学习 · 画面与纠错记录',
      observations: [
        { title: '选题：按观看任务拆分', text: '同一产品可以讲形态、使用任务或操作教程。每条要有不同的观看收益，不把参数换标题当成新选题。' },
        { title: '脚本：先决定画面证明什么', text: '把文案分成识别、动作、结果、比较和感受。“更方便”要让人看见究竟省掉了哪一步。' },
        { title: '剪辑：给操作留下理解时间', text: '教程保留入口、关键动作、结果与条件；比较保留共同前提，不把不同任务拼成一次未发生的操作。' }
      ],
      links: [
        { label: '账号研究总册', url: 'research/view.html?id=1fef94b08d83e1a9' },
        { label: '原片与逐条学习', url: 'research/yingjun/study/' },
        { label: '拍剪方法手册', url: 'research/view.html?id=9b8684ff0f8013ee' }
      ],
      boundary: '公开作品研究；连续视听与原声逐句听审尚未完成。'
    }
  ],
  practice: {
    title: '从研究，走向下一条作品。',
    summary: '两个账号各选五条，记录为什么选、准备怎样重组，以及剪辑时必须保留的条件。',
    status: '选片与重剪计划 · 尚未实剪',
    frames: [
      { title: '操作教程', url: 'research/evidence/068cbe92710581cdc9ccfefd.webp' },
      { title: '工作任务', url: 'research/evidence/a43f169b78ca09ba61606c4d.webp' },
      { title: '单问题验证', url: 'research/evidence/3aecd69e4b75689827dad640.webp' },
      { title: '现场体验', url: 'research/evidence/7e58de6ae07084a60c53b0d2.webp' }
    ],
    links: [
      { label: '十条选片与原片画面', url: 'research/#picks' },
      { label: '重剪计划全文', url: 'research/view.html?id=8d95aa271543c773' }
    ]
  }
};
