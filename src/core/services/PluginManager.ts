export interface Plugin {
  name: string;
  version: string;
  init: () => Promise<void>;
  destroy?: () => void;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private initialized: Set<string> = new Set();

  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} already registered`);
      return;
    }
    this.plugins.set(plugin.name, plugin);
  }

  async load(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    if (this.initialized.has(pluginName)) {
      console.warn(`Plugin ${pluginName} already initialized`);
      return;
    }

    await plugin.init();
    this.initialized.add(pluginName);
  }

  async loadAll(): Promise<void> {
    const promises = Array.from(this.plugins.keys()).map((name) => this.load(name));
    await Promise.all(promises);
  }

  unload(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin?.destroy) {
      plugin.destroy();
    }
    this.initialized.delete(pluginName);
  }

  isLoaded(pluginName: string): boolean {
    return this.initialized.has(pluginName);
  }

  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }
}

export const pluginManager = new PluginManager();
