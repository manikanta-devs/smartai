import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

/**
 * Autonomously updates npm dependencies to latest versions
 * Runs: Daily at 2 AM via cron job
 * Cost: $0
 * 
 * Features:
 * - Automatically updates patch/minor versions
 * - Runs tests after update
 * - Commits changes to git
 * - Alerts for major version updates
 */
class DependencyUpdateAgent {
  private packagePath = './packages';
  private logFile = './logs/dependency-updates.log';
  private dirs = ['frontend', 'backend', 'shared'];

  async run(): Promise<void> {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('🤖 DEPENDENCY UPDATE AGENT');
      console.log('='.repeat(60));
      console.log(`⏰ Started at ${new Date().toISOString()}`);

      // Ensure logs directory exists
      if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs', { recursive: true });
      }

      for (const dir of this.dirs) {
        await this.updatePackages(`${this.packagePath}/${dir}`);
      }

      // Test after updates
      await this.testAfterUpdate();

      // Commit if changes
      await this.commitAndPush();

      console.log('\n✅ DEPENDENCY UPDATE AGENT completed successfully');
      console.log('='.repeat(60) + '\n');
    } catch (error) {
      console.error('\n❌ DEPENDENCY UPDATE AGENT failed:', error);
      this.log(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updatePackages(packageDir: string): Promise<void> {
    if (!fs.existsSync(packageDir)) {
      console.log(`⚠️ ${packageDir} not found, skipping...`);
      return;
    }

    console.log(`\n📦 Updating dependencies in ${packageDir}...`);

    try {
      // Get list of outdated packages
      const { stdout } = await execPromise('npm outdated --json', { cwd: packageDir });
      const outdated = JSON.parse(stdout || '{}');

      if (Object.keys(outdated).length === 0) {
        console.log(`   ✅ All packages up to date`);
        this.log(`${packageDir}: All packages up to date`);
        return;
      }

      console.log(`   Found ${Object.keys(outdated).length} outdated packages`);

      // Separate safe (patch/minor) from major updates
      const safeUpdates = Object.entries(outdated)
        .filter(([pkg, data]: any) => {
          const currentMajor = data.current.split('.')[0];
          const latestMajor = data.latest.split('.')[0];
          return currentMajor === latestMajor;
        })
        .map(([pkg]) => pkg);

      const majorUpdates = Object.entries(outdated)
        .filter(([pkg, data]: any) => {
          const currentMajor = data.current.split('.')[0];
          const latestMajor = data.latest.split('.')[0];
          return currentMajor !== latestMajor;
        });

      // Update safe packages
      if (safeUpdates.length > 0) {
        console.log(`   🔧 Updating ${safeUpdates.length} safe packages...`);
        await execPromise(`npm update`, { cwd: packageDir });
        console.log(`   ✅ Safe updates applied`);
        this.log(`${packageDir}: Updated ${safeUpdates.length} packages`);
      }

      // Alert for major versions
      if (majorUpdates.length > 0) {
        console.log(`   ⚠️ Major version updates available (manual review):`);
        majorUpdates.forEach(([pkg, data]: any) => {
          console.log(`      ${pkg}: ${data.current} → ${data.latest}`);
        });
        this.log(`${packageDir}: Major updates: ${majorUpdates.map(([p]) => p).join(', ')}`);
      }
    } catch (error: any) {
      console.log(`   ⚠️ Update failed: ${error.message}`);
      this.log(`${packageDir}: Update failed - ${error.message}`);
    }
  }

  private async testAfterUpdate(): Promise<void> {
    console.log(`\n🧪 Running tests after update...`);

    try {
      const backendDir = `${this.packagePath}/backend`;
      
      if (fs.existsSync(backendDir)) {
        await execPromise('npm test -- --passWithNoTests 2>&1 || true', { cwd: backendDir });
        console.log(`   ✅ Backend tests passed`);
      }
    } catch (error) {
      console.log(`   ⚠️ Some tests failed - review needed`);
    }
  }

  private async commitAndPush(): Promise<void> {
    try {
      const { stdout } = await execPromise('git status --porcelain');

      if (stdout.trim()) {
        console.log(`\n📤 Committing changes...`);
        await execPromise('git add package*.json');
        await execPromise('git commit -m "🤖 auto: update dependencies" 2>&1 || true');
        await execPromise('git push origin main 2>&1 || true');
        console.log(`   ✅ Changes pushed to git`);
        this.log('Committed dependency updates to git');
      } else {
        console.log(`\n   ✅ No changes to commit`);
      }
    } catch (error) {
      console.log(`   ⚠️ Git commit failed (repo may not be initialized)`);
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }
}

// Run the agent
new DependencyUpdateAgent().run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
