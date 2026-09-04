/*
  En una URL normal de GitHub Pages no necesitas rellenar nada: el usuario y
  el repositorio se detectan automáticamente.

  Si más adelante utilizas un dominio propio, indica aquí el usuario y el repo:
  owner: "TU_USUARIO",
  repository: "pruebas",
*/
const SETTINGS = {
  owner: "anioljordan",
  repository: "pruebas",
  branch: "main",
  ignoredFolders: ["node_modules", "dist", "build", "vendor"]
};

const elements = {
  grid: document.querySelector("#projects-grid"),
  count: document.querySelector("#project-count"),
  status: document.querySelector("#status-text"),
  emptyState: document.querySelector("#empty-state"),
  messageTitle: document.querySelector("#message-title"),
  messageText: document.querySelector("#message-text"),
  retryButton: document.querySelector("#retry-button"),
  repositoryLink: document.querySelector("#repository-link"),
  currentYear: document.querySelector("#current-year")
};

elements.currentYear.textContent = new Date().getFullYear();
elements.retryButton.addEventListener("click", loadProjects);

function getRepositoryDetails() {
  const isGitHubPages = window.location.hostname.endsWith(".github.io");
  let owner = SETTINGS.owner.trim();
  let repository = SETTINGS.repository.trim();

  if (isGitHubPages) {
    owner ||= window.location.hostname.replace(/\.github\.io$/i, "");

    const firstPathPart = window.location.pathname
      .split("/")
      .filter(Boolean)
      .find((part) => part.toLowerCase() !== "index.html");

    repository ||= firstPathPart || `${owner}.github.io`;
  }

  if (!owner || !repository) {
    throw new Error("MISSING_REPOSITORY");
  }

  return { owner, repository };
}

async function githubRequest(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error(`GITHUB_${response.status}`);
  }

  return response.json();
}

function findWebsiteFolders(tree) {
  return tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((path) => /^[^/]+\/index\.html$/i.test(path))
    .map((path) => path.split("/")[0])
    .filter((folder) => !SETTINGS.ignoredFolders.includes(folder))
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

function nameFromFolder(folder) {
  return folder
    .replace(/[-_]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  })[character]);
}

async function getWebsiteMetadata(folder) {
  const websiteUrl = `./${encodeURIComponent(folder)}/`;

  try {
    const response = await fetch(`${websiteUrl}index.html`);

    if (!response.ok) {
      throw new Error("Página no disponible");
    }

    const html = await response.text();
    const documentCopy = new DOMParser().parseFromString(html, "text/html");
    const title = documentCopy.querySelector("title")?.textContent?.trim();

    return {
      folder,
      url: websiteUrl,
      title: title || nameFromFolder(folder)
    };
  } catch {
    return {
      folder,
      url: websiteUrl,
      title: nameFromFolder(folder)
    };
  }
}

function createProjectCard(project, index) {
  const article = document.createElement("article");
  article.className = "project-card";

  const safeTitle = escapeHtml(project.title);
  const safeFolder = escapeHtml(project.folder);
  const safeUrl = escapeHtml(project.url);
  const number = String(index + 1).padStart(2, "0");

  article.innerHTML = `
    <a href="${safeUrl}" target="_blank" rel="noopener" aria-label="Abrir ${safeTitle}">
      <div class="project-card__preview">
        <iframe
          src="${safeUrl}"
          title="Vista previa de ${safeTitle}"
          loading="lazy"
          tabindex="-1"
          aria-hidden="true"
        ></iframe>
        <div class="project-card__shade"></div>
        <span class="project-card__open" aria-hidden="true">↗</span>
      </div>

      <div class="project-card__body">
        <div>
          <h3>${safeTitle}</h3>
          <p>/${safeFolder}</p>
        </div>
        <span class="project-card__number">${number}</span>
      </div>
    </a>
  `;

  return article;
}

function showMessage({ title, text, isError = false }) {
  elements.grid.replaceChildren();
  elements.grid.hidden = true;
  elements.grid.setAttribute("aria-busy", "false");
  elements.emptyState.hidden = false;
  elements.messageTitle.textContent = title;
  elements.messageText.textContent = text;
  elements.retryButton.hidden = !isError;
}

function renderProjects(projects) {
  elements.grid.replaceChildren(...projects.map(createProjectCard));
  elements.grid.hidden = false;
  elements.grid.setAttribute("aria-busy", "false");
  elements.emptyState.hidden = true;
  elements.count.textContent = `${projects.length} ${projects.length === 1 ? "proyecto" : "proyectos"}`;
  elements.status.textContent = "Selecciona una web para abrirla";
}

async function loadProjects() {
  elements.retryButton.hidden = true;
  elements.emptyState.hidden = true;
  elements.grid.hidden = false;
  elements.grid.setAttribute("aria-busy", "true");
  elements.status.textContent = "Cargando las webs del repositorio…";
  elements.count.textContent = "Buscando proyectos…";

  try {
    const { owner, repository } = getRepositoryDetails();
    const repositoryUrl = `https://github.com/${owner}/${repository}`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repository}`;

    elements.repositoryLink.href = repositoryUrl;

    const repositoryData = await githubRequest(apiUrl);
    const branch = SETTINGS.branch.trim() || repositoryData.default_branch;
    const treeData = await githubRequest(
      `${apiUrl}/git/trees/${encodeURIComponent(branch)}?recursive=1`
    );

    const folders = findWebsiteFolders(treeData.tree || []);

    if (folders.length === 0) {
      elements.count.textContent = "0 proyectos";
      elements.status.textContent = "No se han encontrado webs";
      showMessage({
        title: "Todavía no hay proyectos",
        text: "Añade una subcarpeta con un index.html y aparecerá aquí automáticamente."
      });
      return;
    }

    const projects = await Promise.all(folders.map(getWebsiteMetadata));
    renderProjects(projects);
  } catch (error) {
    elements.count.textContent = "Sin conexión";
    elements.status.textContent = "No se pudo leer el repositorio";

    const missingConfiguration = error.message === "MISSING_REPOSITORY";
    showMessage({
      title: missingConfiguration ? "Falta conectar el repositorio" : "No se pudieron cargar las webs",
      text: missingConfiguration
        ? "Al probarlo en local, rellena owner y repository al principio de script.js. En GitHub Pages se detectan automáticamente."
        : "Comprueba que el repositorio sea público y vuelve a intentarlo.",
      isError: true
    });
  }
}

loadProjects();
