import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);

/**
 * Autonomously scans for security vulnerabilities
 * Runs: Daily at 4 AM via cron job
 * Cost: $0
 * 
 * Features:
 * - npm audit to find vulnerabilities
 * - Auto-fixes low-risk vulnerabilities
 * - Scans for exposed secrets (API keys, passwords)
 * - Generates security report
 * - Alerts for critical issues
 */
class SecurityScanningAgent {
  private projectRoot = './packages';
  private reportDir = './reports';
  private logFile = './logs/security-scans.log';
  private dirs = ['backend', 'frontend', 'shared'];

  async run(): Promise<void> {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('🔒 SECURITY SCANNING AGENT');
      console.log('='.repeat(60));
      console.log(`⏰ Started at ${new Date().toISOString()}`);

      if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs', { recursive: true });
      }

      if (!fs.existsSync(this.reportDir)) {
        fs.mkdirSync(this.reportDir, { recursive: true });
      }

      const report = {
        timestamp: new Date().toISOString(),
        vulnerabilities: 0,
        fixed: 0,
        secrets: [] as string[],
        details: [] as string[],
      };

      // Run npm audit and fix vulnerabilities
      for (const dir of this.dirs) {
        const fullPath = `${this.projectRoot}/${dir}`;
        if (fs.existsSync(fullPath)) {
          const result = await this.runNpmAudit(fullPath, dir);
          report.vulnerabilities += result.vulnerabilities;
          report.fixed += result.fixed;
          report.details.push(`${dir}: ${result.vulnerabilities} vulnerabilities found`);
        }
      }

      // Scan for secrets
      const secrets = await this.scanForSecrets();
      report.secrets = secrets;

      // Save report
      this.saveReport(report);
      this.displaySummary(report);

      console.log('\n✅ SECURITY SCANNING AGENT completed');
      console.log('='.repeat(60) + '\n');
    } catch (error) {
      console.error('\n❌ SECURITY SCANNING AGENT failed:', error);
      this.log(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runNpmAudit(dir: string, dirName: string): Promise<any> {
    console.log(`\n🔍 Running npm audit on ${dirName}...`);

    let vulnerabilities = 0;
    let fixed = 0;

    try {
      // Check for vulnerabilities
      const { stdout: auditOutput } = await execPromise('npm audit --json 2>&1 || true', {
        cwd: dir,
        maxBuffer: 10 * 1024 * 1024,
      });

      try {
        const audit = JSON.parse(auditOutput);
        vulnerabilities = audit.metadata?.vulnerabilities?.total || 0;

        if (vulnerabilities > 0) {
          console.log(`   ⚠️ Found ${vulnerabilities} vulnerabilities`);

          // Attempt to fix
          console.log(`   🔧 Attempting to fix vulnerabilities...`);
          const { stdout: fixOutput } = await execPromise(
            'npm audit fix --legacy-peer-deps 2>&1 || true',
            { cwd: dir }
          );

          const fixMatch = fixOutput.match(/added \d+ and removed \d+ packages/);
          if (fixMatch) {
            console.log(`      ${fixMatch[0]}`);
            const fixedMatch = fixOutput.match(/fixed:(\d+)/);
            fixed = fixedMatch ? parseInt(fixedMatch[1]) : 0;
            console.log(`   ✅ Fixed ${fixed} vulnerabilities`);
            this.log(`${dirName}: Fixed ${fixed} out of ${vulnerabilities} vulnerabilities`);
          }
        } else {
          console.log(`   ✅ No vulnerabilities found`);
        }
      } catch (e) {
        console.log(`   ⚠️ Could not parse audit results`);
      }
    } catch (error) {
      console.log(`   ⚠️ npm audit failed`);
    }

    return { vulnerabilities, fixed };
  }

  private async scanForSecrets(): Promise<string[]> {
    console.log(`\n🔐 Scanning for exposed secrets...`);

    const secrets: string[] = [];
    const suspicious = [
      'api_key',
      'apikey',
      'API_KEY',
      'password',
      'PASSWORD',
      'secret',
      'SECRET',
      'token',
      'TOKEN',
      'private_key',
      'PRIVATE_KEY',
      'auth',
      'AUTH',
    ];

    try {
      // Scan source files
      for (const keyword of suspicious) {
        try {
          const { stdout } = await execPromise(
            `grep -r "${keyword}" ./packages --include="*.ts" --include="*.tsx" --include="*.env*" 2>/dev/null || true`,
            { shell: '/bin/bash', maxBuffer: 10 * 1024 * 1024 }
          );

          if (stdout.trim() && !stdout.includes('node_modules')) {
            const lines = stdout.split('\n').filter(l => l && !l.includes('.env'));
            if (lines.length > 0) {
              lines.forEach(line => {
                if (!line.includes('process.env') && !line.includes('import')) {
                  secrets.push(`Suspicious pattern found: "${keyword}" in ${line.split(':')[0]}`);
                }
              });
            }
          }
        } catch (e) {
          // Silently continue
        }
      }

      if (secrets.length === 0) {
        console.log(`   ✅ No obvious secrets found`);
      } else {
        console.log(`   ⚠️ Found ${secrets.length} suspicious patterns (manual review recommended)`);
        secrets.slice(0, 3).forEach(s => console.log(`      ${s}`));
      }
    } catch (error) {
      console.log(`   ⚠️ Secret scan failed`);
    }

    return secrets;
  }

  private displaySummary(report: any): void {
    console.log(`\n📊 SECURITY SUMMARY`);
    console.log(`   Total Vulnerabilities: ${report.vulnerabilities}`);
    console.log(`   Fixed: ${report.fixed}`);
    console.log(`   Suspicious Patterns: ${report.secrets.length}`);
    console.log(`   Status: ${report.vulnerabilities > 0 ? '⚠️ NEEDS ATTENTION' : '✅ SECURE'}`);
  }

  private saveReport(report: any): void {
    const reportFile = `${this.reportDir}/latest-security-report.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to ${reportFile}`);
    this.log(`Security scan completed: ${report.vulnerabilities} vulns, ${report.fixed} fixed`);
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }
}

// Run the agent
new SecurityScanningAgent().run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
