import path from 'path'

const root = path.dirname(__dirname)

export const concatFile = (folder: string, name: string) => {
  let file = path.join(root, folder, name)

  file = file.replace(/\\/g, '/')
  if (!path.extname(file)) {
    file += '.js'
  }

  return file
}
