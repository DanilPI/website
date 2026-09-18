/*
 * This is the main file to edit when personalizing the site.
 * Leave any optional value empty ("" or []) and the interface will handle it.
 */
const CONFIG = {
  profile: {
    name: "danilp1 website",
    username: "user",
    hostname: "danilp1.ru",
    bio: "Just Daniil's TUI website, nothing special."
  },

  socialLinks: [],

  projects: [],

  contact: [],

  terminal: {
    // Leave these empty to load directly into a clean prompt.
    // Any text added here is rendered as plain terminal output.
    welcomeTitle: "danilp1.ru Website",
    welcomeMessage: "Hello, World!",
    welcomeHint: "Type 'help' for show all available commands",
    promptPath: "/",
    promptSymbol: "#",

    // Rename a command by changing its name. The action key must stay the same.
    commands: {
      help: { name: "help", description: "Show all available commands" },
      about: { name: "about", description: "Read a short info about this website" },
      links: { name: "links", description: "Show webmaster's social links" },
      projects: { name: "projects", description: "Browse featured webmaster's projects" },
      contact: { name: "contact", description: "View contact webmaster's information" },
      clear: { name: "clear", description: "Clear the terminal output" },
    },

    // Add commands here without editing script.js. See README.md for an example.
    customCommands: [],
  },

  appearance: {
    accentColor: "#c9d7db",
  },
};
