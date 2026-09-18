(() => {
  "use strict";

  const REQUIRED_ACTIONS = ["help", "about", "links", "projects", "contact", "clear"];
  const DEFAULT_COMMANDS = {
    help: { name: "help", description: "Show all available commands" },
    about: { name: "about", description: "Read a short profile" },
    links: { name: "links", description: "Open social links" },
    projects: { name: "projects", description: "Browse featured projects" },
    contact: { name: "contact", description: "View contact information" },
    clear: { name: "clear", description: "Clear the terminal output" },
  };

  const config = typeof CONFIG === "object" && CONFIG ? CONFIG : {};
  const profile = config.profile || {};
  const terminalConfig = config.terminal || {};

  const terminal = document.querySelector("#terminal");
  const output = document.querySelector("#terminal-output");
  const form = document.querySelector("#command-form");
  const input = document.querySelector("#command-input");
  const prompt = document.querySelector("#prompt");

  const history = [];
  let historyIndex = 0;

  const isText = (value) => typeof value === "string" && value.trim().length > 0;
  const asArray = (value) => (Array.isArray(value) ? value : []);

  function text(value, className) {
    const node = document.createElement("span");
    node.textContent = value;
    if (className) node.className = className;
    return node;
  }

  function paragraph(value, className = "") {
    const node = document.createElement("p");
    node.textContent = value;
    if (className) node.className = className;
    return node;
  }

  function safeUrl(value) {
    if (!isText(value)) return null;

    const candidate = value.trim();
    const hasProtocol = /^[a-z][a-z\d+.-]*:/i.test(candidate);
    if (!hasProtocol) return candidate;

    try {
      const url = new URL(candidate, window.location.href);
      return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  function makeLink(label, url) {
    const href = safeUrl(url);
    if (!href || !isText(label)) return null;

    const link = document.createElement("a");
    link.href = href;
    link.textContent = label.trim();

    if (/^https?:/i.test(href) || href.startsWith("//")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    return link;
  }

  function getCommandSettings(action) {
    const configured = terminalConfig.commands?.[action] || {};
    const fallback = DEFAULT_COMMANDS[action];

    return {
      action,
      name: isText(configured.name) ? configured.name.trim().toLowerCase() : fallback.name,
      description: isText(configured.description)
        ? configured.description.trim()
        : fallback.description,
      aliases: asArray(configured.aliases)
        .filter(isText)
        .map((alias) => alias.trim().toLowerCase()),
    };
  }

  function getCustomCommands() {
    return asArray(terminalConfig.customCommands)
      .filter((command) => command && isText(command.name))
      .map((command) => ({
        action: "custom",
        name: command.name.trim().toLowerCase(),
        description: isText(command.description)
          ? command.description.trim()
          : "Custom command",
        aliases: asArray(command.aliases)
          .filter(isText)
          .map((alias) => alias.trim().toLowerCase()),
        lines: asArray(command.lines).filter(isText),
        links: asArray(command.links),
      }));
  }

  const commands = [
    ...REQUIRED_ACTIONS.map(getCommandSettings),
    ...getCustomCommands(),
  ];

  function commandByAction(action) {
    return commands.find((command) => command.action === action);
  }

  function findCommand(value) {
    const query = value.toLowerCase();
    return commands.find(
      (command) => command.name === query || command.aliases.includes(query),
    );
  }

  function createPrompt() {
    const username = isText(profile.username) ? profile.username.trim() : "guest";
    const hostname = isText(profile.hostname) ? profile.hostname.trim() : "localhost";
    const path = isText(terminalConfig.promptPath) ? terminalConfig.promptPath.trim() : "~";
    const symbol = isText(terminalConfig.promptSymbol) ? terminalConfig.promptSymbol.trim() : "$";
    const fragment = document.createDocumentFragment();

    fragment.append(text(username, "prompt-user"));
    fragment.append(text("@", "prompt-muted"));
    fragment.append(text(hostname, "prompt-host"));
    fragment.append(text(":", "prompt-muted"));
    fragment.append(text(path, "prompt-path"));
    fragment.append(text(symbol, "prompt-symbol"));

    return fragment;
  }

  function createEntry(className = "") {
    const entry = document.createElement("section");
    entry.className = `terminal-entry ${className}`.trim();
    return entry;
  }

  function appendEntry(entry) {
    output.append(entry);
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  function appendDetail(parent, key, value) {
    if (!isText(value)) return;
    const line = document.createElement("p");
    line.append(text(key, "detail-key"), text(` ${value.trim()}`));
    parent.append(line);
  }

  function renderWelcome() {
    const lines = [
      terminalConfig.welcomeTitle,
      terminalConfig.welcomeMessage,
      terminalConfig.welcomeHint,
    ].filter(isText);

    if (!lines.length) return;

    const entry = createEntry("welcome-output");
    lines.forEach((line) => entry.append(paragraph(line.trim())));
    output.append(entry);
  }

  function renderCommandEcho(commandName) {
    const entry = createEntry("command-echo");
    const line = document.createElement("div");
    line.className = "echo-line";
    line.append(createPrompt(), text(commandName, "echo-command"));
    entry.append(line);
    output.append(entry);
  }

  function renderHelp() {
    const entry = createEntry();
    entry.append(paragraph("Available commands:", "output-title"));

    const list = document.createElement("ul");
    list.className = "command-list";
    commands.forEach((command) => {
      const item = document.createElement("li");
      item.append(
        text(command.name, "command-name"),
        text(command.description, "command-description"),
      );
      list.append(item);
    });

    entry.append(list);
    appendEntry(entry);
  }

  function renderAbout() {
    const entry = createEntry();
    let detailCount = 0;

    if (isText(profile.name)) {
      entry.append(paragraph(profile.name.trim(), "profile-name"));
      detailCount += 1;
    }

    if (isText(profile.bio)) {
      entry.append(paragraph(profile.bio.trim()));
      detailCount += 1;
    }

    if (!detailCount) entry.append(paragraph("No profile details yet.", "empty-state"));
    appendEntry(entry);
  }

  function renderLinks() {
    const entry = createEntry();
    const links = asArray(config.socialLinks).filter(
      (item) => item && isText(item.label || item.name) && safeUrl(item.url),
    );

    if (!links.length) {
      entry.append(paragraph("No links added yet.", "empty-state"));
      appendEntry(entry);
      return;
    }

    const list = document.createElement("ul");
    list.className = "link-list";
    links.forEach((item) => {
      const listItem = document.createElement("li");
      const label = item.label || item.name;
      const link = makeLink(label, item.url);
      if (!link) return;
      if (isText(item.icon)) listItem.append(text(`${item.icon.trim()} `));
      listItem.append(link);
      list.append(listItem);
    });

    entry.append(list);
    appendEntry(entry);
  }

  function renderProjects() {
    const entry = createEntry();
    const projects = asArray(config.projects).filter((project) => project && isText(project.name));

    if (!projects.length) {
      entry.append(paragraph("No projects yet.", "empty-state"));
      appendEntry(entry);
      return;
    }

    const list = document.createElement("ol");
    list.className = "project-list";
    projects.forEach((project, index) => {
      const item = document.createElement("li");
      const heading = document.createElement("p");
      heading.className = "project-heading";
      heading.append(
        text(`${String(index + 1).padStart(2, "0")}.`, "project-index"),
        text(project.name.trim()),
      );
      item.append(heading);

      if (isText(project.description)) {
        item.append(paragraph(project.description.trim(), "project-description"));
      }

      const tags = asArray(project.tags).filter(isText).map((tag) => tag.trim());
      if (tags.length) item.append(paragraph(`[${tags.join("] [")}]`, "project-tags"));

      const liveLink = makeLink("project", project.url);
      const repoLink = makeLink("source", project.repo);
      if (liveLink || repoLink) {
        const links = document.createElement("p");
        links.className = "project-links";
        if (liveLink) links.append(liveLink);
        if (repoLink) links.append(repoLink);
        item.append(links);
      }

      list.append(item);
    });

    entry.append(list);
    appendEntry(entry);
  }

  function renderContact() {
    const entry = createEntry();
    const methods = asArray(config.contact).filter(
      (item) => item && isText(item.name) && isText(item.value),
    );

    if (!methods.length) {
      entry.append(paragraph("No contact methods added yet.", "empty-state"));
      appendEntry(entry);
      return;
    }

    const list = document.createElement("ul");
    list.className = "contact-list";
    methods.forEach((method) => {
      const item = document.createElement("li");
      const link = makeLink(method.value.trim(), method.url);
      item.append(text(method.name.trim(), "detail-key"), text(" "), link || text(method.value.trim()));
      list.append(item);
    });

    entry.append(list);
    appendEntry(entry);
  }

  function renderCustom(command) {
    const entry = createEntry();

    if (!command.lines.length && !command.links.length) {
      entry.append(paragraph("This command has no output yet.", "empty-state"));
    }

    command.lines.forEach((line) => entry.append(paragraph(line.trim())));

    const links = document.createElement("p");
    links.className = "custom-links";
    command.links.forEach((item) => {
      if (!item) return;
      const link = makeLink(item.label || item.name, item.url);
      if (link) links.append(link);
    });
    if (links.children.length) entry.append(links);

    appendEntry(entry);
  }

  function renderUnknown(commandName) {
    const entry = createEntry();
    const message = document.createElement("p");
    message.className = "error-message";
    message.append(text("command not found: "), text(commandName, "error-command"));
    entry.append(message);

    const help = commandByAction("help");
    if (help) entry.append(paragraph(`Type "${help.name}" to see available commands.`, "output-muted"));
    appendEntry(entry);
  }

  function execute(rawValue) {
    const value = rawValue.trim();
    if (!value) return;

    history.push(value);
    historyIndex = history.length;

    const commandName = value.split(/\s+/)[0].toLowerCase();
    const command = findCommand(commandName);

    if (command?.action === "clear") {
      output.replaceChildren();
      return;
    }

    renderCommandEcho(value);

    if (!command) {
      renderUnknown(commandName);
      return;
    }

    const renderers = {
      help: renderHelp,
      about: renderAbout,
      links: renderLinks,
      projects: renderProjects,
      contact: renderContact,
    };

    if (command.action === "custom") renderCustom(command);
    else renderers[command.action]?.();
  }

  function setInputValue(value) {
    input.value = value;
    requestAnimationFrame(() => input.setSelectionRange(value.length, value.length));
  }

  function handleHistory(event) {
    if (!history.length) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      setInputValue(history[historyIndex]);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      setInputValue(historyIndex === history.length ? "" : history[historyIndex]);
    }
  }

  function focusInput() {
    input.focus({ preventScroll: true });
  }

  function initialize() {
    const username = isText(profile.username) ? profile.username.trim() : "guest";
    const hostname = isText(profile.hostname) ? profile.hostname.trim() : "localhost";

    document.title = isText(profile.name)
      ? `${profile.name.trim()} — ${username}@${hostname}`
      : `${username}@${hostname}`;

    if (isText(config.appearance?.accentColor)) {
      document.documentElement.style.setProperty("--accent", config.appearance.accentColor.trim());
    }

    prompt.replaceChildren(createPrompt());
    renderWelcome();
    focusInput();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value;
    setInputValue("");
    execute(value);
  });

  input.addEventListener("keydown", handleHistory);

  terminal.addEventListener("click", (event) => {
    if (!event.target.closest("a")) focusInput();
  });

  initialize();
})();
