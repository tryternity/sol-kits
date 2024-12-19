const path = require('path');
const fs = require('fs');

function getPackageJson() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function setPackageJson(packageJson) {
  const packageJsonPath = path.join(__dirname, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function forceExcludeDependency() {
  const packageJson = getPackageJson();
  const dependencyToExclude = '@solana/codecs-data-structures'; // 将此处替换为你要排除的依赖项名称

  // 遍历所有依赖项，删除指定依赖项及其子依赖中的相关引用
  function deleteDependency(dependencies) {
    if (dependencies) {
      for (const key in dependencies) {
        if (key === dependencyToExclude) {
          delete dependencies[key];
        } else if (dependencies[key].dependencies) {
          deleteDependency(dependencies[key].dependencies);
        }
      }
    }
  }

  deleteDependency(packageJson.dependencies);
  deleteDependency(packageJson.devDependencies);

  setPackageJson(packageJson);
}

forceExcludeDependency();