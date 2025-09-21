#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Prepares the npm package by copying .github content and README.md temporarily
 * This is called before publishing and cleaned up after
 */
class NpmPackagePreparation {
  constructor() {
    this.repoRoot = path.join(__dirname, '..');
    this.npmDir = path.join(this.repoRoot, 'npm');
    this.sourceGithubDir = path.join(this.repoRoot, '.github');
    this.targetGithubDir = path.join(this.npmDir, '.github');
    this.sourceReadme = path.join(this.repoRoot, 'README.md');
    this.targetReadme = path.join(this.npmDir, 'README.md');
  }

  async prepare() {
    console.log(chalk.blue('📦 Preparing npm package...'));
    
    try {
      // Check if source .github directory exists
      if (!await fs.pathExists(this.sourceGithubDir)) {
        throw new Error('Source .github directory not found');
      }

      // Check if source README.md exists
      if (!await fs.pathExists(this.sourceReadme)) {
        throw new Error('Source README.md not found');
      }

      // Remove existing .github in npm directory if it exists
      if (await fs.pathExists(this.targetGithubDir)) {
        console.log(chalk.yellow('🗑️  Removing existing .github copy...'));
        await fs.remove(this.targetGithubDir);
      }

      // Remove existing README.md in npm directory if it exists
      if (await fs.pathExists(this.targetReadme)) {
        console.log(chalk.yellow('🗑️  Removing existing README.md copy...'));
        await fs.remove(this.targetReadme);
      }

      // Copy .github content to npm package
      console.log(chalk.green('📋 Copying .github content to npm package...'));
      await fs.copy(this.sourceGithubDir, this.targetGithubDir);

      // Copy README.md to npm package
      console.log(chalk.green('📄 Copying README.md to npm package...'));
      await fs.copy(this.sourceReadme, this.targetReadme);

      console.log(chalk.green('✅ npm package prepared successfully'));
      return true;

    } catch (error) {
      console.error(chalk.red('❌ npm package preparation failed:'), error.message);
      return false;
    }
  }

  async cleanup() {
    console.log(chalk.blue('🧹 Cleaning up npm package...'));
    
    try {
      // Remove the temporary .github copy
      if (await fs.pathExists(this.targetGithubDir)) {
        console.log(chalk.yellow('🗑️  Removing temporary .github copy...'));
        await fs.remove(this.targetGithubDir);
      }

      // Remove the temporary README.md copy
      if (await fs.pathExists(this.targetReadme)) {
        console.log(chalk.yellow('🗑️  Removing temporary README.md copy...'));
        await fs.remove(this.targetReadme);
      }

      console.log(chalk.green('✅ npm package cleaned up successfully'));
      return true;

    } catch (error) {
      console.error(chalk.red('❌ npm package cleanup failed:'), error.message);
      return false;
    }
  }
}

// Handle command line usage
if (require.main === module) {
  const prep = new NpmPackagePreparation();
  const action = process.argv[2];

  if (action === 'cleanup') {
    prep.cleanup().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    prep.prepare().then(success => {
      process.exit(success ? 0 : 1);
    });
  }
}

module.exports = NpmPackagePreparation;