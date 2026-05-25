/* ===== 个人信息配置（默认值） ===== */
const defaultUserInfo = {
  nickname: "fwhhhh",
  tagline: "懒惰成性的人在往下坠...",
  avatar: "avatar.jpg",
  gender: "男生",
  girlfriend: "打烊(LMQ)",
  girlfriendAvatar: "girlfriend.jpg",
};

function loadUserInfo() {
  try {
    const saved = localStorage.getItem("homepage_userinfo");
    if (saved) return JSON.parse(saved);
  } catch (_) { /* ignore */ }
  return { ...defaultUserInfo };
}

function saveUserInfo(info) {
  localStorage.setItem("homepage_userinfo", JSON.stringify(info));
}

let userInfo = loadUserInfo();

/* ===== 项目数据（默认值） ===== */
const defaultProjects = [
  {
    name: "示例项目",
    description: "这是一个示例项目，点击这里修改为你的第一个项目吧。",
    tags: ["HTML", "CSS"],
    link: "https://github.com",
  },
  {
    name: "课程设计",
    description: "数据结构课设——一个简单的校园导航系统。",
    tags: ["C++", "QT"],
    link: "https://github.com",
  },
  {
    name: "个人博客",
    description: "基于 Hexo 搭建的技术博客，记录学习笔记。",
    tags: ["Hexo", "Markdown"],
    link: "https://github.com",
  },
];

function loadProjects() {
  try {
    const saved = localStorage.getItem("homepage_projects");
    if (saved) return JSON.parse(saved);
  } catch (_) { /* ignore */ }
  return defaultProjects.map((p) => ({ ...p }));
}

function saveProjects(list) {
  localStorage.setItem("homepage_projects", JSON.stringify(list));
}

let projects = loadProjects();

/* ===== 社交媒体链接 ===== */
const socialLinks = [
  {
    name: "bilibili",
    icon: "📺",
    url: "https://space.bilibili.com/1314628396?spm_id_from=333.1007.0.0",
  },
  {
    name: "邮箱",
    icon: "📧",
    url: "mailto:3458821629@qq.com",
  },
];

/* ===== 初始化：用配置填充页面 ===== */
function applyUserInfo() {
  if (userInfo.nickname) {
    document.querySelector(".hero-name").textContent = userInfo.nickname;
  }
  if (userInfo.tagline) {
    document.querySelector(".hero-tagline").textContent = userInfo.tagline;
  }
  const gfImg = document.getElementById("gfAvatarImg");
  if (userInfo.avatar) {
    document.getElementById("avatarImg").src = userInfo.avatar;
  }
  if (userInfo.girlfriendAvatar && gfImg) {
    gfImg.src = userInfo.girlfriendAvatar;
  }

  // 渲染附加信息
  const meta = document.getElementById("heroMeta");
  if (!meta) return;
  const items = [];
  if (userInfo.gender) {
    items.push(`
      <div class="hero-meta-item">
        <span class="meta-icon">♂</span>
        <span class="meta-label">${escapeHtml(userInfo.gender)}</span>
      </div>`);
  }
  if (userInfo.girlfriend) {
    items.push(`
      <div class="hero-meta-item">
        <span class="meta-icon">💕</span>
        <span class="meta-label">${escapeHtml(userInfo.girlfriend)}</span>
      </div>`);
  }
  meta.innerHTML = items.join("");
}

/* ===== 欢迎弹窗 ===== */
function initWelcome() {
  const overlay = document.getElementById("welcomeOverlay");
  if (!overlay) return;

  const today = new Date().toISOString().slice(0, 10); // "2026-05-25"
  const lastVisit = localStorage.getItem("homepage_last_visit");

  if (lastVisit === today) {
    overlay.remove();
    return;
  }

  document.getElementById("welcomeClose").addEventListener("click", () => {
    overlay.classList.add("hidden");
    localStorage.setItem("homepage_last_visit", today);
    overlay.addEventListener("animationend", () => overlay.remove());
  });
}

/* ===== 渲染项目卡片 ===== */
function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  grid.innerHTML = projects
    .map(
      (p, i) => `
    <div class="project-card animate-on-scroll" data-link="${escapeHtml(p.link || "")}">
      <div class="project-actions">
        <button class="btn-edit" data-index="${i}" title="编辑">✎</button>
        <button class="btn-delete" data-index="${i}" title="删除">✕</button>
      </div>
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description)}</p>
      <div class="project-tags">
        ${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}
      </div>
      ${p.link ? '<div class="project-link-hint">查看详情 →</div>' : ""}
    </div>`
    )
    .join("");

  // 点击卡片跳转（排除操作按钮区域）
  grid.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".project-actions")) return;
      const link = card.dataset.link;
      if (link) window.open(link, "_blank");
    });
  });

  // 编辑按钮
  grid.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      requireAuth(() => openProjectModal(parseInt(btn.dataset.index)));
    });
  });

  // 删除按钮
  grid.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      requireAuth(() => deleteProject(parseInt(btn.dataset.index)));
    });
  });

  // 重新触发滚动动画
  initScrollAnimations();
}

/* ===== 项目编辑弹窗 ===== */
let editingIndex = -1;

// 待执行的编辑操作（需验证通过后才执行）
let pendingAction = null;

/* ===== 密码验证 ===== */
// 修改下面这行来更换密码（SHA-256 哈希值）
const PASSWORD_HASH = "b2f39f84b44f8fa20852bb9f6699fcc5dff2285f7f2e05b123bb672b41a89a06";

function isAuthed() {
  return sessionStorage.getItem("homepage_auth") === "1";
}

function setAuthed(v) {
  if (v) {
    sessionStorage.setItem("homepage_auth", "1");
  } else {
    sessionStorage.removeItem("homepage_auth");
  }
  updateLockIcon();
}

async function sha256(message) {
  const buf = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function updateLockIcon() {
  const lock = document.getElementById("authLock");
  if (!lock) return;
  if (isAuthed()) {
    lock.textContent = "🔓";
    lock.classList.add("unlocked");
    lock.title = "已登录 · 点击退出";
  } else {
    lock.textContent = "🔒";
    lock.classList.remove("unlocked");
    lock.title = "管理登录";
  }
}

function requireAuth(action) {
  if (isAuthed()) {
    action();
  } else {
    pendingAction = action;
    openAuthModal();
  }
}

function openAuthModal() {
  document.getElementById("authPassword").value = "";
  document.getElementById("authError").classList.add("hidden");
  document.getElementById("authModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("authPassword").focus(), 100);
}

function closeAuthModal() {
  document.getElementById("authModal").classList.add("hidden");
  pendingAction = null;
}

async function submitAuth() {
  const input = document.getElementById("authPassword").value;
  if (!input) return;
  const hash = await sha256(input);
  if (hash === PASSWORD_HASH) {
    setAuthed(true);
    closeAuthModal();
    if (pendingAction) {
      pendingAction();
      pendingAction = null;
    }
  } else {
    document.getElementById("authError").classList.remove("hidden");
    document.getElementById("authPassword").value = "";
    document.getElementById("authPassword").focus();
  }
}

/* ===== 原来的弹窗函数（加鉴权包裹） ===== */

function openProjectModal(index) {
  const modal = document.getElementById("projectModal");
  const title = document.getElementById("modalTitle");
  if (!modal) return;

  editingIndex = index;
  if (index >= 0) {
    title.textContent = "编辑项目";
    const p = projects[index];
    document.getElementById("projName").value = p.name;
    document.getElementById("projDesc").value = p.description;
    document.getElementById("projTags").value = p.tags.join(", ");
    document.getElementById("projLink").value = p.link || "";
  } else {
    title.textContent = "添加项目";
    document.getElementById("projName").value = "";
    document.getElementById("projDesc").value = "";
    document.getElementById("projTags").value = "";
    document.getElementById("projLink").value = "";
  }
  modal.classList.remove("hidden");
}

function closeProjectModal() {
  document.getElementById("projectModal").classList.add("hidden");
}

function submitProject() {
  const name = document.getElementById("projName").value.trim();
  const desc = document.getElementById("projDesc").value.trim();
  const tagsStr = document.getElementById("projTags").value.trim();
  const link = document.getElementById("projLink").value.trim();

  if (!name) { alert("请填写项目名称"); return; }

  const tags = tagsStr
    ? tagsStr.split(/[,，]+/).map((t) => t.trim()).filter(Boolean)
    : [];

  const project = { name, description: desc, tags, link };

  if (editingIndex >= 0) {
    projects[editingIndex] = project;
  } else {
    projects.push(project);
  }

  saveProjects(projects);
  renderProjects();
  closeProjectModal();
}

function deleteProject(index) {
  if (!confirm(`确定要删除「${projects[index].name}」吗？`)) return;
  projects.splice(index, 1);
  saveProjects(projects);
  renderProjects();
}

/* ===== 个人简介编辑弹窗 ===== */
function openProfileModal() {
  document.getElementById("profileModal").classList.remove("hidden");
  document.getElementById("profileNickname").value = userInfo.nickname || "";
  document.getElementById("profileTagline").value = userInfo.tagline || "";
  document.getElementById("profileGender").value = userInfo.gender || "";
  document.getElementById("profileGirlfriend").value = userInfo.girlfriend || "";
  document.getElementById("profileAvatar").value = userInfo.avatar || "";
  document.getElementById("profileGfAvatar").value = userInfo.girlfriendAvatar || "";
}

function closeProfileModal() {
  document.getElementById("profileModal").classList.add("hidden");
}

function submitProfile() {
  const nickname = document.getElementById("profileNickname").value.trim();
  const tagline = document.getElementById("profileTagline").value.trim();
  const gender = document.getElementById("profileGender").value.trim();
  const girlfriend = document.getElementById("profileGirlfriend").value.trim();
  const avatar = document.getElementById("profileAvatar").value.trim();
  const girlfriendAvatar = document.getElementById("profileGfAvatar").value.trim();

  if (!nickname) { alert("请填写昵称"); return; }

  Object.assign(userInfo, { nickname, tagline, gender, girlfriend, avatar, girlfriendAvatar });
  saveUserInfo(userInfo);
  applyUserInfo();
  closeProfileModal();
}

/* ===== 渲染社交链接 ===== */
function renderSocialLinks() {
  const container = document.getElementById("socialLinks");
  if (!container) return;

  container.innerHTML = socialLinks
    .map(
      (s) => `
    <div class="social-item animate-on-scroll" data-url="${escapeHtml(s.url)}">
      <span class="social-icon">${escapeHtml(s.icon)}</span>
      <span class="social-name">${escapeHtml(s.name)}</span>
    </div>`
    )
    .join("");

  container.querySelectorAll(".social-item").forEach((item) => {
    item.addEventListener("click", () => {
      window.open(item.dataset.url, "_blank");
    });
  });
}

/* ===== 滚动动画 (Intersection Observer) ===== */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".animate-on-scroll").forEach((el) => {
    observer.observe(el);
  });

  // Hero 区域立即显示
  const heroEl = document.querySelector(".hero .animate-on-scroll");
  if (heroEl) {
    heroEl.classList.add("visible");
  }
}

/* ===== 导航栏滚动阴影 ===== */
function initNavScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = "0 2px 12px rgba(61, 57, 41, 0.08)";
    } else {
      navbar.style.boxShadow = "";
    }
  });
}

/* ===== HTML 转义工具 ===== */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ===== 启动 ===== */
document.addEventListener("DOMContentLoaded", () => {
  applyUserInfo();
  initWelcome();
  renderProjects();
  renderSocialLinks();
  initScrollAnimations();
  initNavScroll();

  // 项目弹窗事件
  document.getElementById("addProjectBtn")?.addEventListener("click", () => {
    requireAuth(() => openProjectModal(-1));
  });
  document.getElementById("modalCancel")?.addEventListener("click", closeProjectModal);
  document.getElementById("modalConfirm")?.addEventListener("click", submitProject);
  document.getElementById("projectModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeProjectModal();
  });

  // 鉴权弹窗事件
  document.getElementById("authCancel")?.addEventListener("click", closeAuthModal);
  document.getElementById("authConfirm")?.addEventListener("click", submitAuth);
  document.getElementById("authPassword")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAuth();
  });
  document.getElementById("authModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeAuthModal();
  });

  // 角落锁图标
  document.getElementById("authLock")?.addEventListener("click", () => {
    if (isAuthed()) {
      if (confirm("确定要退出管理吗？")) setAuthed(false);
    } else {
      openAuthModal();
    }
  });

  // 个人简介编辑
  document.getElementById("heroEditBtn")?.addEventListener("click", () => {
    requireAuth(() => openProfileModal());
  });
  document.getElementById("profileCancel")?.addEventListener("click", closeProfileModal);
  document.getElementById("profileConfirm")?.addEventListener("click", submitProfile);
  document.getElementById("profileModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeProfileModal();
  });

  updateLockIcon();
});
