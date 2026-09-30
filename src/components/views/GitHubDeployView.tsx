import React, { useState } from 'react';
import {
  Github,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Download,
  AlertTriangle,
  Play,
  Globe,
  Settings,
  GitBranch,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import JSZip from 'jszip';

export const GitHubDeployView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [githubUsername, setGithubUsername] = useState('lucianocuevasmehauod');
  const [repoName, setRepoName] = useState('sublistock-pro');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  const cleanUser = githubUsername.trim() || 'tu-usuario';
  const cleanRepo = repoName.trim() || 'sublistock-pro';

  const repoUrl = `https://github.com/${cleanUser}/${cleanRepo}.git`;
  const pagesUrl = `https://${cleanUser}.github.io/${cleanRepo}/`;

  const commands = [
    `git init`,
    `git add .`,
    `git commit -m "feat: SubliStock Pro con Cuentas Corrientes y Produccion"`,
    `git branch -M main`,
    `git remote add origin ${repoUrl}`,
    `git push -u origin main`
  ];

  const fullCommandBlock = commands.join('\n');

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    setZipSuccess(false);

    try {
      const zip = new JSZip();

      // Project configurations and deploy files
      zip.file(
        '.github/workflows/deploy.yml',
        `name: Deploy to GitHub Pages\n\non:\n  push:\n    branches:\n      - main\n      - master\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: 'pages'\n  cancel-in-progress: true\n\njobs:\n  build-and-deploy:\n    environment:\n      name: github-pages\n      url: \${{ steps.deployment.outputs.page_url }}\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout Repository\n        uses: actions/checkout@v4\n      - name: Setup Node.js 20\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n      - name: Install Dependencies\n        run: npm ci\n      - name: Build Application\n        run: npm run build\n      - name: Setup GitHub Pages\n        uses: actions/configure-pages@v4\n      - name: Upload Build Artifact\n        uses: actions/upload-pages-artifact@v3\n        with:\n          path: './dist'\n      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v4\n`
      );

      zip.file(
        '.gitignore',
        `node_modules/\nbuild/\ndist/\ncoverage/\n.DS_Store\n*.log\n.env*\n!.env.example\n`
      );

      zip.file(
        'README.md',
        `# ${cleanRepo} - SubliStock Pro\n\nSistema de Gestión de Taller de Sublimación con Cuentas Corrientes y Control de Insumos.\n\n### Desplegado en GitHub Pages:\n[${pagesUrl}](${pagesUrl})\n`
      );

      // Trigger download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanRepo}-github-deploy.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Github className="w-6 h-6 text-white" />
            <span>Centro de Despliegue en GitHub (GitHub Pages)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configuración lista para producción con GitHub Actions CI/CD automatizado y rutas relativas
          </p>
        </div>

        <a
          href="https://github.com/new"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Crear Repositorio en GitHub</span>
        </a>
      </div>

      {/* Pre-Configuration Status Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Ruta Base Vite</span>
            <span className="text-[11px] text-slate-400 font-mono">base: './' (Activo)</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">GitHub Actions</span>
            <span className="text-[11px] text-slate-400 font-mono">.github/workflows/deploy.yml</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Build de Producción</span>
            <span className="text-[11px] text-slate-400 font-mono">npm run build (Listo)</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Archivos Seguros</span>
            <span className="text-[11px] text-slate-400 font-mono">.gitignore configurado</span>
          </div>
        </div>
      </div>

      {/* Interactive Customizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-orange-400" />
          <span>Personalizar con tu Usuario de GitHub</span>
        </h3>
        <p className="text-xs text-slate-400">
          Ingresa tu nombre de usuario de GitHub y el nombre que le darás al repositorio para generar los comandos exactos y tu URL final de GitHub Pages:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
              Tu Usuario de GitHub
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={e => setGithubUsername(e.target.value)}
              placeholder="lucianocuevasmehauod"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
              Nombre del Repositorio
            </label>
            <input
              type="text"
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              placeholder="sublistock-pro"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Generated Target URL Preview */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Tu App quedará publicada online en:</span>
            <a
              href={pagesUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 mt-0.5"
            >
              <span>{pagesUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="text-[11px] text-slate-400">
            <span className="font-mono text-slate-300">Repositorio: github.com/{cleanUser}/{cleanRepo}</span>
          </div>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Pasos para Publicar en GitHub en 3 Minutos</span>
        </h3>

        {/* Step 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="font-bold text-white text-sm">Crear el Repositorio en GitHub</h4>
          </div>
          <p className="text-xs text-slate-400 pl-8">
            Entra a{' '}
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline font-semibold"
            >
              github.com/new
            </a>
            , escribe el nombre <code className="bg-slate-950 px-1.5 py-0.5 rounded text-white font-mono">{cleanRepo}</code>, selecciona <strong>Público</strong> y haz clic en <strong>Create repository</strong> (deja desmarcadas las opciones de README y .gitignore ya que este proyecto ya los incluye).
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="font-bold text-white text-sm">Ejecutar los Comandos de Subida en la Terminal</h4>
            </div>

            <button
              onClick={() => copyToClipboard(fullCommandBlock, 99)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedIndex === 99 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 99 ? '¡Comandos Copiados!' : 'Copiar Todos los Comandos'}</span>
            </button>
          </div>

          <div className="pl-8 space-y-2">
            <p className="text-xs text-slate-400">
              Abre tu terminal en la carpeta del proyecto y pega estos comandos:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-x-auto space-y-1">
              {commands.map((cmd, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <span className="text-cyan-400 mr-2">$</span>
                  <span className="flex-1">{cmd}</span>
                  <button
                    onClick={() => copyToClipboard(cmd, idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded transition-opacity"
                    title="Copiar línea"
                  >
                    {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="font-bold text-white text-sm">Activar GitHub Pages en 1 Clic</h4>
          </div>

          <div className="pl-8 space-y-2 text-xs text-slate-400">
            <p>
              Una vez hecho el <code className="bg-slate-950 px-1 py-0.5 rounded text-white font-mono">push</code>, dirígete a tu repositorio en GitHub:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Haz clic en la pestaña superior <strong>Settings</strong> (Configuración del repositorio).</li>
              <li>En el menú lateral izquierdo, haz clic en <strong>Pages</strong>.</li>
              <li>En la sección <strong>Build and deployment</strong> &gt; <strong>Source</strong>, selecciona:</li>
            </ol>

            <div className="p-3 bg-slate-950 border border-emerald-900/60 rounded-lg flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono font-bold text-xs">
                GitHub Actions
              </span>
              <span className="text-xs text-slate-300">
                Selecciona la opción <strong>"GitHub Actions"</strong> (el archivo <code className="text-orange-300">deploy.yml</code> ya está listo en el proyecto).
              </span>
            </div>

            <p className="text-slate-400 pt-1">
              ✨ ¡Listo! En 60 a 90 segundos GitHub compilará automáticamente tu sitio y verás el cartel verde con el enlace a tu aplicación funcionando en vivo.
            </p>
          </div>
        </div>
      </div>

      {/* Alternative Deployments & Package Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zip Download */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar Archivos de Despliegue (.ZIP)</span>
          </h4>
          <p className="text-xs text-slate-400">
            Descarga un paquete con el workflow de GitHub Actions, .gitignore y README preconfigurados listos para arrastrar a tu repositorio:
          </p>

          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingZip ? 'Generando archivo ZIP...' : 'Descargar Configuración de Deploy'}</span>
          </button>

          {zipSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 justify-center">
              <Check className="w-3.5 h-3.5" /> Archivo descargado exitosamente.
            </p>
          )}
        </div>

        {/* Deploy on Vercel / Netlify */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>¿También quieres desplegar en Vercel o Netlify?</span>
          </h4>
          <p className="text-xs text-slate-400">
            Una vez que tu repositorio esté en GitHub, puedes desplegarlo también con 1 solo clic y dominio propio gratuito en:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Importar en Vercel</span>
            </a>

            <a
              href="https://app.netlify.com/start"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Importar en Netlify</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
