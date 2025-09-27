#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

class CopilotInstructionsSetup {
  constructor() {
    // Point to .github in the npm package (included via files in package.json)
    this.sourceDir = path.join(__dirname, '..', '.github');
    this.targetDir = path.join(process.cwd(), '.github');
  }

  async run() {
    console.log(chalk.blue.bold('\n🤖 GitHub Copilot Instructions Setup\n'));
    
    try {
      // Check if .github directory exists
      const githubDirExists = await fs.pathExists(this.targetDir);
      
      if (githubDirExists) {
        await this.handleExistingDirectory();
      } else {
        await this.installInstructions();
      }
      
      this.showSuccessMessage();
      
    } catch (error) {
      console.error(chalk.red('Setup failed:'), error.message);
      process.exit(1);
    }
  }

  async handleExistingDirectory() {
    console.log(chalk.yellow('⚠️  .github directory already exists.\n'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: [
          { name: 'Skip installation (keep existing files)', value: 'skip' },
          { name: 'Backup existing and install fresh', value: 'backup' },
          { name: 'Merge (add missing files only)', value: 'merge' },
          { name: 'Force overwrite (replace all)', value: 'force' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }
    ]);

    switch (action) {
      case 'skip':
        console.log(chalk.yellow('Skipping installation. Existing files preserved.'));
        return;
      case 'backup':
        await this.backupAndInstall();
        break;
      case 'merge':
        await this.mergeInstructions();
        break;
      case 'force':
        await this.forceInstall();
        break;
      case 'cancel':
        console.log(chalk.yellow('Installation cancelled.'));
        process.exit(0);
    }
  }

  async backupAndInstall() {
    const backupDir = path.join(process.cwd(), '.github.backup');
    
    console.log(chalk.yellow('📦 Creating backup...'));
    await fs.copy(this.targetDir, backupDir);
    console.log(chalk.green(`✓ Backup created at: ${backupDir}`));
    
    await fs.remove(this.targetDir);
    await this.installInstructions();
  }

  async mergeInstructions() {
    console.log(chalk.yellow('🔄 Merging instructions...'));
    
    const sourceFiles = await this.getFileList(this.sourceDir);
    let addedCount = 0;
    
    for (const file of sourceFiles) {
      // Skip workflows directory
      if (file.startsWith('workflows')) {
        continue;
      }
      
      const targetFile = path.join(this.targetDir, file);
      const sourceFile = path.join(this.sourceDir, file);
      
      if (!(await fs.pathExists(targetFile))) {
        await fs.ensureDir(path.dirname(targetFile));
        await fs.copy(sourceFile, targetFile);
        addedCount++;
      }
    }
    
    console.log(chalk.green(`✓ Added ${addedCount} new files`));
  }

  async forceInstall() {
    console.log(chalk.yellow('🔄 Force installing...'));
    await fs.remove(this.targetDir);
    await this.installInstructions();
  }

  async installInstructions() {
    console.log(chalk.yellow('📁 Installing copilot instructions...'));
    
    // Copy with filter to exclude workflows directory
    await fs.copy(this.sourceDir, this.targetDir, {
      filter: (src, dest) => {
        // Exclude workflows directory and its contents
        const relativePath = path.relative(this.sourceDir, src);
        return !relativePath.startsWith('workflows');
      }
    });
    
    console.log(chalk.green('✓ Instructions installed successfully'));
  }

  async getFileList(dir, relativePath = '') {
    const files = [];
    const items = await fs.readdir(path.join(dir, relativePath));
    
    for (const item of items) {
      const itemPath = path.join(relativePath, item);
      const fullPath = path.join(dir, itemPath);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...await this.getFileList(dir, itemPath));
      } else {
        files.push(itemPath);
      }
    }
    
    return files;
  }

  showSuccessMessage() {
    console.log(chalk.green.bold('\n✅ Setup completed successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.cyan('1. Read .github/how-to-use.md for usage instructions'));
    console.log(chalk.cyan('2. Configure required MCP servers (GitHub, Playwright)'));
    console.log(chalk.cyan('3. Start a conversation with GitHub Copilot'));
    console.log(chalk.cyan('4. Let Copilot propose the appropriate role for your task\n'));
  }
}

// Run the setup
const setup = new CopilotInstructionsSetup();
setup.run();