# SubliStock Pro 🎨🚀
> Sistema Integral de Gestión de Stock, Insumos, Cuentas Corrientes y Producción para Talleres de Sublimación y Estampado.

![SubliStock Pro](https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80)

---

## 📋 Características Principales

- 📦 **Control de Stock e Insumos**: Tazas (cerámica/polímero), textiles (remeras modal, spum, algodón), gorras trucker, llaveros, tintas y vinilos.
- ⚠️ **Alertas Críticas Inteligentes**: Detección de insumos por debajo del stock de seguridad y demanda de producción pendiente, con opción de silenciar/sacar alertas individualmente o en lote.
- 💰 **Cuentas Corrientes (Clientes y Proveedores)**:
  - Registro de movimientos (Debe / Haber / Saldo acumulado).
  - Emisión y descarga de recibos oficiales de cobro y pago.
  - Exportación de extractos de cuenta en PDF membretado y planillas Excel (.xlsx).
  - Envío automático de resumen y datos bancarios por WhatsApp.
- 📑 **Presupuestador con Desglose de Costos Unitarios**: Cálculo de insumo base, flete, papel, tinta, electricidad y margen pretendido con exportación en PDF membretado listo para imprimir.
- 🔥 **Seguimiento de Producción & Fechas de Entrega**: Estados (Diseño, Producción, Control, Listo, Entregado), carga de bocetos fotográficos y semáforo de urgencia (Vence Hoy, Atrasado, etc.).
- 🏢 **Configuración de Taller**: Nombre de fantasía, logo corporativo, CUIT, datos bancarios (CBU/CVU/Alias), políticas de seña y membrete institucional.

---

## 🚀 Despliegue en GitHub Pages (Deploy en GitHub)

Este repositorio viene pre-configurado con **GitHub Actions** (`.github/workflows/deploy.yml`) y ruta relativa (`base: './'`) para desplegarse automáticamente en GitHub Pages sin necesidad de configuración adicional.

### Pasos Rápidos para Desplegar:

1. **Crear repositorio en GitHub**:
   Crea un nuevo repositorio en [github.com/new](https://github.com/new) con el nombre que prefieras (por ejemplo `sublistock-pro`).

2. **Inicializar y subir el código**:
   ```bash
   git init
   git add .
   git commit -m "feat: SubliStock Pro con Cuentas Corrientes y Deploy"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/sublistock-pro.git
   git push -u origin main
   ```

3. **Activar GitHub Pages**:
   - En tu repositorio de GitHub, dirígete a: **Settings** > **Pages**
   - En **Build and deployment** > **Source**, selecciona: **`GitHub Actions`**
   - ¡Listo! En 1 a 2 minutos tu aplicación estará publicada y accesible en:
     `https://TU-USUARIO.github.io/sublistock-pro/`

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```
