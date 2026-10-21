import * as THREE from 'three/webgpu'
import tools from '../data/tools.js'

export function personalizeWorld(game) {
    const list = document.getElementById('personal-tool-list')
    for (const tool of tools) {
        const link = document.createElement('a')
        link.className = 'personal-tool'
        link.href = `../tools.html?tool=${tool.id}`
        const name = document.createElement('strong')
        name.textContent = tool.name
        const mode = document.createElement('span')
        mode.textContent = tool.badge
        const copy = document.createElement('p')
        copy.textContent = tool.summary
        link.append(name, mode, copy)
        list.append(link)
    }
    document.querySelectorAll('[data-personal-menu]').forEach(button => {
        button.addEventListener('click', () => game.menu.open(button.dataset.personalMenu))
    })
    const labels = {
        home:'关于刘俊威', myProjects:'我的作品', myTools:'创作工具', options:'设置',
        controls:'驾驶操作', achievements:'探索成就', circuit:'赛道', behindTheScene:'关于网站'
    }
    for(const [key, label] of Object.entries(labels)) {
        const item = game.menu.items.get(key)
        item?.navigationElement.setAttribute('aria-label',label)
        item?.navigationElement.setAttribute('title',label)
    }
    // Hide the original author's portrait while preserving the physical park layout.
    const statue = game.world.areas.social.references.items.get('statue')?.[0]
    if(statue) {
        statue.userData.object.visual.object3D.removeFromParent()
        statue.userData.object.physical.body.setEnabled(false)
    }
    // This area describes production stages, not the original author's dated career.
    for(const digit of game.world.areas.career.year.digits) digit.mesh.visible = false
    const hash = location.hash.slice(1)
    const page = {tools:'myTools',cases:'myProjects',showcase:'myProjects',about:'home',experience:'home'}[hash]
    if(page) game.menu.open(page)
    document.documentElement.classList.add('personal-ready')
}

export function workflowTexture(key) {
    const stages = {
        careerHetic:['AI 辅助选题','收集问题，找到值得展开的切口'],
        careerUzik:['脚本撰写','把资料组织成观众听得懂的叙事'],
        careerImmersiveGarden:['视频剪辑','让画面、字幕与旁白共同解释问题'],
        careerOnlineTeacher:['发布','整理标题、封面与发布内容'],
        careerFreelancer:['复盘','从评论反馈里找到下一次改进'],
        careerIRLTeacher:['创作工具','把重复工作，做成可复用的小工具']
    }
    const [title,copy] = stages[key] || ['内容创作','从问题到作品']
    const canvas = document.createElement('canvas')
    canvas.width=2048;canvas.height=256
    const ctx=canvas.getContext('2d')
    ctx.fillStyle='#000';ctx.fillRect(0,0,2048,256)
    ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.font='700 86px "PingFang SC",sans-serif';ctx.fillText(title,40,96)
    ctx.font='38px "PingFang SC",sans-serif';ctx.fillText(copy,40,200)
    const texture=new THREE.CanvasTexture(canvas)
    texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace
    return texture
}
