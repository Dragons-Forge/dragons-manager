import { copyFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import path from 'path';

try {
    // Lê a versão diretamente do package.json
    const rawPkg = readFileSync('./package.json', 'utf-8');
    const pkg = JSON.parse(rawPkg);
    const version = pkg.version;

    const src = './src-tauri/target/release/dragons-manager.exe';
    const outDir = './src-tauri/target/release/bundle';

    // Garantir que a pasta de bundles existe
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
    }

    const dest = path.join(outDir, `MultiRoblox Manager_${version}_Portable.exe`);

    if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`\n✅ Versão Portável gerada com sucesso!`);
        console.log(`📁 Local: ${dest}\n`);
    } else {
        console.error(`\n❌ Erro: Executável base não encontrado em ${src}`);
        console.error(`Certifique-se de executar o build do tauri antes disso.\n`);
    }
} catch (error) {
    console.error("Erro ao gerar versão portável:", error);
}
