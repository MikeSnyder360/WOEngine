import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load default config
const defaultsPath = path.join(__dirname, 'app.config.defaults.json');
const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));

export default () => {
  // Check for tenant manifest (set by orchestrator at build time)
  const manifestPath = process.env.HIIT_TENANT_MANIFEST;

  if (!manifestPath) {
    // No tenant override - use defaults (customer #0 / electronsltd's own app)
    return {
      expo: defaults,
    };
  }

  // Load tenant-specific overrides
  if (!fs.existsSync(manifestPath)) {
    console.error(`Tenant manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Merge tenant overrides into defaults
  const config = { ...defaults };

  // Top-level overrides
  if (manifest.name) config.name = manifest.name;
  if (manifest.icon) config.icon = manifest.icon;
  if (manifest.backgroundColor) config.backgroundColor = manifest.backgroundColor;

  // iOS overrides
  if (manifest.ios) {
    config.ios = { ...config.ios, ...manifest.ios };
    if (manifest.ios.bundleIdentifier) {
      config.ios.bundleIdentifier = manifest.ios.bundleIdentifier;
    }
  }

  // Android overrides
  if (manifest.android) {
    config.android = { ...config.android, ...manifest.android };
    if (manifest.android.package) {
      config.android.package = manifest.android.package;
    }
    if (manifest.android.adaptiveIcon) {
      config.android.adaptiveIcon = {
        ...config.android.adaptiveIcon,
        ...manifest.android.adaptiveIcon,
      };
    }
  }

  // Program URL for runtime fetch (stored in extra for the app to read)
  if (manifest.programUrl) {
    config.extra = {
      ...config.extra,
      programUrl: manifest.programUrl,
    };
  }

  return {
    expo: config,
  };
};
