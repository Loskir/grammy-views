import * as fs from 'fs'

const envExample = fs.readFileSync('.env.example', 'utf-8')

const exampleVars = new Set(envExample.split('\n').map((v) => v.split('=')[0]).filter((v) => !!v))
const vars = new Set(Object.keys(process.env))

let missingVars: string[] = []
for (const v of exampleVars.values()) {
  if (!vars.has(v)) {
    missingVars.push(v)
  }
}

if (missingVars.length > 0) {
  console.warn(`❗️ Some environment variables are missing: ${missingVars.join(', ')}`)
}
