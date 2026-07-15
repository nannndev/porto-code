
import { TerminalCommandContext, CommandDefinition, SidebarItemConfig, Theme } from '../App/types';
import { generateFileContent, PORTFOLIO_DATA } from '../App/constants';

const findItemRecursive = (items: SidebarItemConfig[], idOrFileName: string): SidebarItemConfig | null => {
  for (const item of items) {
    if (item.id === idOrFileName || item.fileName === idOrFileName) {
      return item;
    }
    if (item.isFolder && item.children) {
      const found = findItemRecursive(item.children, idOrFileName);
      if (found) return found;
    }
  }
  return null;
};


export const COMMANDS: Record<string, CommandDefinition> = {
  help: {
    description: 'Lists all available commands.',
    handler: (args, context) => {
      const commandList: string[] = ['Available commands:'];
      Object.keys(COMMANDS).sort().forEach(cmdName => {
        const cmd = COMMANDS[cmdName];
        let helpText = `  ${cmdName}`;
        if (cmd.usage) helpText += ` ${cmd.usage}`;
        helpText += ` - ${cmd.description}`;
        commandList.push(helpText);
      });
      return commandList;
    }
  },
  ls: {
    description: 'Lists files and folders in the specified path or root.',
    usage: '[path]',
    handler: (args, context) => {
      const path = args[0];
      let itemsToList: SidebarItemConfig[] | undefined = context.sidebarItems;
      let basePath = '/';

      if (path) {
        const foundFolder = findItemRecursive(context.sidebarItems, path);
        if (foundFolder && foundFolder.isFolder) {
          itemsToList = foundFolder.children;
          basePath = `/${foundFolder.label}/`;
        } else if (foundFolder && !foundFolder.isFolder) {
          return `Error: '${path}' is a file, not a directory.`;
        } else {
          return `Error: Directory '${path}' not found.`;
        }
      }
      
      if (!itemsToList || itemsToList.length === 0) {
        return `No items found in ${basePath}`;
      }
      
      return itemsToList.map(item => `${item.isFolder ? '📁' : '📄'} ${item.label}`);
    }
  },
  cat: {
    description: 'Displays the content of a portfolio file.',
    usage: '<filename>',
    handler: (args, context) => {
      if (args.length === 0) return 'Usage: cat <filename>';
      const fileName = args[0];
      const item = findItemRecursive(context.sidebarItems, fileName);
      if (item && !item.isFolder && item.fileName) {
        const content = generateFileContent(item.fileName, context.portfolioData);
        return [`Content of ${fileName}:`, content];
      }
      return `Error: File '${fileName}' not found or is a directory.`;
    }
  },
  theme: {
    description: 'Lists available themes or changes the current theme.',
    usage: '[theme_name]',
    handler: (args, context) => {
      if (args.length === 0) {
        const themeList = context.themes.map(t => 
          `${t.name}${t.name === context.currentThemeName ? ' (current)' : ''}`
        );
        return ['Available themes:', ...themeList, 'Usage: theme <theme_name>'];
      }
      const themeName = args.join(' ');
      const themeExists = context.themes.find(t => t.name.toLowerCase() === themeName.toLowerCase());
      if (themeExists) {
        context.changeTheme(themeExists.name);
        return `Theme changed to ${themeExists.name}.`;
      }
      return `Error: Theme '${themeName}' not found.`;
    }
  },
  open: {
    description: 'Opens a file in the editor.',
    usage: '<filename>',
    handler: (args, context) => {
      if (args.length === 0) return 'Usage: open <filename>';
      const fileName = args[0];
      const itemToOpen = findItemRecursive(context.sidebarItems, fileName);
      if (itemToOpen && !itemToOpen.isFolder) {
        context.openTab(itemToOpen);
        return `Opening ${fileName}...`;
      }
      return `Error: File '${fileName}' not found or is a directory.`;
    }
  },
  run: {
    description: 'Runs a script (e.g., generate_cv.ts).',
    usage: '<scriptname>',
    handler: (args, context) => {
      if (args.length === 0) return 'Usage: run <scriptname>';
      const scriptName = args[0];
      if (scriptName === 'generate_cv.ts') {
        context.runScript('generate_cv.ts', 5000, [
            "Starting CV generation...", "Fetching portfolio data...", "Initializing PDF document...",
            "Formatting header...", "Adding summary...", "Processing work experience...",
            "Detailing education...", "Listing skills...", "Compiling PDF...", "Finalizing..."
        ]);
        return; // Output handled by runScript
      }
      return `Error: Unknown script '${scriptName}'. Try 'run generate_cv.ts'.`;
    }
  },
  clear: {
    description: 'Clears the terminal screen.',
    handler: (args, context) => {
      context.clearOutput();
    }
  },
  echo: {
    description: 'Displays text.',
    usage: '<text>',
    handler: (args, context) => {
      return args.join(' ');
    }
  },
  date: {
    description: 'Displays the current date and time.',
    handler: () => new Date().toLocaleString()
  },
  contact: {
    description: 'Displays contact information.',
    handler: (args, context) => {
      const { email, phone, linkedIn, otherSocial } = context.portfolioData;
      const contactInfo = [
        `Nandang Eka Prasetya`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `LinkedIn: ${linkedIn}`,
      ];
      if (otherSocial) {
        contactInfo.push(`${otherSocial.name}: ${otherSocial.url}`);
      }
      contactInfo.push("For more, type: open contact.json");
      return contactInfo;
    }
  },
  repo: {
    description: 'Opens the portfolio GitHub repository in a new tab.',
    handler: () => {
      window.open(PORTFOLIO_DATA.otherSocial?.url || 'https://github.com/nannndev', '_blank');
      return 'Opening repository...';
    }
  },
  pwd: {
    description: 'Prints the current working directory (simulated).',
    handler: () => '/'
  },
};

export const processCommand = (input: string, context: TerminalCommandContext): string | string[] | void => {
  const [commandName, ...args] = input.trim().split(/\s+/);
  if (!commandName) return;

  const command = COMMANDS[commandName.toLowerCase()];
  if (command) {
    try {
      return command.handler(args, context);
    } catch (error: any) {
        context.addAppLog('error', `Error executing command: ${commandName}`, 'TerminalCommand', { error: error.message, args });
        return `Error executing command '${commandName}': ${error.message}`;
    }
  } else {
    return `Command not found: ${commandName}. Type 'help' for a list of commands.`;
  }
};
