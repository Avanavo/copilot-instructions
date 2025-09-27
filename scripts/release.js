#!/usr/bin/env node

const fs = require('fs-extra');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');

class ReleaseManager {
  constructor() {
    this.npmPackagePath = './npm/package.json';
    this.nugetProjectPath = './nuget/Avanavo.CopilotInstructions.csproj';
  }

  async run() {
    console.log(chalk.blue.bold('\n📦 Dual Package Release Manager (npm + NuGet)\n'));

    try {
      await this.checkPrerequisites();
      const currentVersion = await this.getCurrentVersion();
      const newVersion = await this.selectNewVersion(currentVersion);

      await this.confirmRelease(currentVersion, newVersion);
      await this.performRelease(newVersion);

      console.log(chalk.green.bold('\n🎉 Dual package release completed successfully!\n'));
      this.showNextSteps(newVersion);

    } catch (error) {
      console.error(chalk.red('\n❌ Release failed:'), error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log(chalk.yellow('🔍 Checking prerequisites...'));

    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Not in a git repository');
    }

    // Check if npm and nuget package files exist
    if (!await fs.pathExists(this.npmPackagePath)) {
      throw new Error(`npm package.json not found at ${this.npmPackagePath}`);
    }

    if (!await fs.pathExists(this.nugetProjectPath)) {
      throw new Error(`NuGet project file not found at ${this.nugetProjectPath}`);
    }

    // Check if working directory is clean
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    try {
      if (status.trim()) {
        throw new Error('Working directory is not clean. Please commit or stash changes.', { cause: 'status' });
      }
    } catch (error) {
      throw error;
    } 

    // Check if we're on main branch
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (branch !== 'main') {
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: `You're on branch "${branch}" instead of "main". Continue anyway?`,
            default: false
          }
        ]);

        if (!proceed) {
          throw new Error('Release cancelled');
        }
      }
    } catch (error) {
      if (error.message === 'Release cancelled') throw error;
      console.log(chalk.yellow('⚠️  Unable to check current branch'));
    }

    console.log(chalk.green('✅ Prerequisites check passed'));
  }

  async getCurrentVersion() {
    // Get version from npm package.json
    const npmPkg = await fs.readJson(this.npmPackagePath);
    const npmVersion = npmPkg.version;

    // Get version from NuGet .csproj
    const csprojContent = await fs.readFile(this.nugetProjectPath, 'utf8');
    const versionMatch = csprojContent.match(/<PackageVersion>(.*?)<\/PackageVersion>/);
    const nugetVersion = versionMatch ? versionMatch[1] : null;

    // Verify versions are synchronized
    if (nugetVersion && npmVersion !== nugetVersion) {
      console.log(chalk.yellow(`⚠️  Version mismatch detected:`));
      console.log(chalk.yellow(`   npm:   ${npmVersion}`));
      console.log(chalk.yellow(`   NuGet: ${nugetVersion}`));

      const { useVersion } = await inquirer.prompt([
        {
          type: 'list',
          name: 'useVersion',
          message: 'Which version should be used as the current version?',
          choices: [
            { name: `npm version (${npmVersion})`, value: npmVersion },
            { name: `NuGet version (${nugetVersion})`, value: nugetVersion }
          ]
        }
      ]);

      return useVersion;
    }

    return npmVersion;
  }

  async selectNewVersion(currentVersion) {
    const versions = this.calculateVersions(currentVersion);

    const { versionType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionType',
        message: `Current version is ${currentVersion}. Select new version:`,
        choices: [
          { name: `Patch (${versions.patch}) - Bug fixes`, value: 'patch' },
          { name: `Minor (${versions.minor}) - New features`, value: 'minor' },
          { name: `Major (${versions.major}) - Breaking changes`, value: 'major' },
          { name: 'Custom version', value: 'custom' }
        ]
      }
    ]);

    if (versionType === 'custom') {
      const { customVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: 'Enter custom version:',
          validate: (input) => {
            if (!/^\d+\.\d+\.\d+$/.test(input)) {
              return 'Version must be in format x.y.z';
            }
            return true;
          }
        }
      ]);
      return customVersion;
    }

    return versions[versionType];
  }

  calculateVersions(currentVersion) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    return {
      patch: `${major}.${minor}.${patch + 1}`,
      minor: `${major}.${minor + 1}.0`,
      major: `${major + 1}.0.0`
    };
  }

  async confirmRelease(currentVersion, newVersion) {
    console.log('\n' + chalk.cyan('📦 Dual Package Release Summary:'));
    console.log(chalk.cyan(`  Current version: ${currentVersion}`));
    console.log(chalk.cyan(`  New version:     ${newVersion}`));
    console.log(chalk.cyan(`  Git tag:         v${newVersion}`));
    console.log(chalk.cyan(`  📦 npm package:   @avanavo/copilot-instructions@${newVersion}`));
    console.log(chalk.cyan(`  📦 NuGet package: Avanavo.CopilotInstructions@${newVersion}`));
    console.log(chalk.cyan(`  🚀 This will trigger automatic publishing to both npm and NuGet\n`));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with dual package release?',
        default: false
      }
    ]);

    if (!confirm) {
      throw new Error('Release cancelled by user');
    }
  }

  async performRelease(newVersion) {
    console.log(chalk.yellow('\n🔄 Performing dual package release...'));

    // Update npm package.json version
    console.log(chalk.yellow('📝 Updating npm package.json...'));
    const npmPkg = await fs.readJson(this.npmPackagePath);
    npmPkg.version = newVersion;
    await fs.writeJson(this.npmPackagePath, npmPkg, { spaces: 2 });

    // Update NuGet .csproj version
    console.log(chalk.yellow('📝 Updating NuGet .csproj version...'));
    await this.updateNuGetVersion(newVersion);

    // Stage and commit version changes
    console.log(chalk.yellow('📄 Committing version changes...'));
    execSync(`git add ${this.npmPackagePath} ${this.nugetProjectPath}`, { stdio: 'inherit' });
    execSync(`git commit -m "Release v${newVersion} - Sync npm and NuGet versions"`, { stdio: 'inherit' });

    // Create and push tag
    console.log(chalk.yellow('🏷️  Creating git tag...'));
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

    // Push commits and tags
    console.log(chalk.yellow('⬆️  Pushing to remote...'));
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });

    // Create and publish GitHub release
    console.log(chalk.yellow('🚀 Creating and publishing GitHub release...'));
    await this.createGitHubRelease(newVersion);

    console.log(chalk.green('✅ Dual package release committed and pushed'));
  }

  async updateNuGetVersion(newVersion) {
    const csprojContent = await fs.readFile(this.nugetProjectPath, 'utf8');

    // Update PackageVersion element
    const updatedContent = csprojContent.replace(
      /<PackageVersion>.*?<\/PackageVersion>/,
      `<PackageVersion>${newVersion}</PackageVersion>`
    );

    await fs.writeFile(this.nugetProjectPath, updatedContent, 'utf8');
  }

  async createGitHubRelease(version) {
    try {
      // Try to create release using GitHub CLI
      execSync(`gh release create v${version} --generate-notes --title "Release v${version}"`, {
        stdio: 'inherit'
      });
      console.log(chalk.green(`✅ GitHub release v${version} created and published`));
      console.log(chalk.green(`🚀 Publishing workflows will prepare and publish packages automatically`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not auto-create GitHub release (gh CLI not available)`));
      console.log(chalk.yellow(`📋 Please manually create the release:`));
      console.log(chalk.blue(`https://github.com/Avanavo/copilot-instructions/releases/new?tag=v${version}`));
    }
  }

  showNextSteps(version) {
    console.log(chalk.cyan('🎉 Dual package release completed successfully!'));
    console.log(chalk.cyan('\n🚀 Next steps:'));
    console.log(chalk.cyan('1. Monitor the publish workflows in the Actions tab'));
    console.log(chalk.cyan('2. Workflows will prepare npm package and publish to both registries'));
    console.log(chalk.cyan('3. Verify packages are published to both:'));
    console.log(chalk.cyan('   📦 npm: @avanavo/copilot-instructions@' + version));
    console.log(chalk.cyan('   📦 NuGet: Avanavo.CopilotInstructions@' + version));
    console.log(chalk.cyan('\n📊 Package Distribution Links (after publishing):'));
    console.log(chalk.blue(`npm: https://www.npmjs.com/package/@avanavo/copilot-instructions`));
    console.log(chalk.blue(`NuGet: https://www.nuget.org/packages/Avanavo.CopilotInstructions`));
    console.log(chalk.cyan('\n� GitHub Release:'));
    console.log(chalk.blue(`https://github.com/Avanavo/copilot-instructions/releases/tag/v${version}`));
  }
}

// Run if called directly
if (require.main === module) {
  const releaseManager = new ReleaseManager();
  releaseManager.run().catch(error => {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  });
}

module.exports = ReleaseManager;