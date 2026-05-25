/* ===== 个人信息配置 ===== */
const userInfo = {
  nickname: "fwhhhh",
  tagline: "懒惰成性的人在往下坠...",
  avatar: "", // 填头像图片URL，留空则用默认占位图
};

/* ===== 项目数据 ===== */
const projects = [
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
  if (userInfo.avatar) {
    document.getElementById("avatarImg").src = userInfo.avatar;
  }
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
      (p) => `
    <div class="project-card animate-on-scroll" data-link="${p.link || ""}">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description)}</p>
      <div class="project-tags">
        ${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}
      </div>
      ${p.link ? '<div class="project-link-hint">查看详情 →</div>' : ""}
    </div>`
    )
    .join("");

  // 点击卡片跳转
  grid.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
      const link = card.dataset.link;
      if (link) window.open(link, "_blank");
    });
  });
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
});
