import process from 'node:process'

import { program } from '@commander-js/extra-typings'
import consola from 'consola'
import { fs, path } from 'zx'

import { loadJannaGitConfig } from '../config/load'
import { mergeGuards } from '../merge-guards'

program.command('merge').requiredOption('-f, --file <file>').action(async (options) => {
  const gitConfig = await loadJannaGitConfig()
  const {
    // .git/COMMIT_EDITMSG
    // .git/MERGE_MSG
    file,
  } = options

  // --- FIX START ---
  // 检查 'file' (由 Git 钩子传入的提交信息文件路径) 是否是绝对路径
  const isAbsolute = path.isAbsolute(file);
  
  // 如果是绝对路径 (Git Worktree 环境下的情况)，则直接使用该路径。
  // 如果是相对路径 (标准 Git 环境下的情况)，则将其与当前工作目录 (process.cwd()) 拼接，以构造出正确的绝对路径。
  const messageFilePath = isAbsolute ? file : path.join(process.cwd(), file);
  
  // 现在，无论在哪种环境下，messageFilePath 都包含了正确、有效的文件路径
  const gitMessage = await fs.readFile(messageFilePath, 'utf-8');
  // --- FIX END ---

  try {
    await mergeGuards(
      gitMessage,
      gitConfig.mergeGuards,
    )
  } catch (err) {
    consola.error(err)
    consola.info('╭──────────────────────────────────────')
    consola.info(`│ You should clean your workspace with:`)
    consola.info(`│     \`git merge --abort\``)
    consola.info(`│ And enure merge from branch correctly`)
    consola.info('╰──────────────────────────────────────')
    process.exit(1)
  }
})

export default program
