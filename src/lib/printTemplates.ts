import { promises as fs } from 'fs';
import path from 'path';

const templatesDir = path.join(process.cwd(), 'data', 'print_templates');

export async function getTemplate(kind: 'receipt' | 'kitchen' | 'test'): Promise<string> {
    const fileName = kind === 'test' ? 'receipt.html' : `${kind}.html`;
    const filePath = path.join(templatesDir, fileName);
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(`Could not read template ${fileName}`, error);
        return `<h1>Error: Template ${fileName} not found.</h1>`;
    }
}

export async function saveTemplate(kind: 'receipt' | 'kitchen', html: string): Promise<void> {
    const filePath = path.join(templatesDir, `${kind}.html`);
    await fs.mkdir(templatesDir, { recursive: true });
    await fs.writeFile(filePath, html, 'utf-8');
}

// Simple mustache-like renderer
export async function render(kind: 'receipt' | 'kitchen', data: Record<string, any>): Promise<string> {
    let template = await getTemplate(kind);
    let output = template;

    // Handle {{#each}} blocks
    output = output.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, block) => {
        const items = data[key];
        if (!Array.isArray(items)) return '';
        // This is a simplified version; doesn't support nested each or complex context
        return items.map(item => {
            let renderedBlock = block;
            for (const itemKey in item) {
                renderedBlock = renderedBlock.replace(new RegExp(`\\{\\{${itemKey}\\}\\}`, 'g'), item[itemKey]);
            }
            return renderedBlock;
        }).join('');
    });
    
    // Handle {{#if}} blocks (basic existence check)
    output = output.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, block) => {
        return data[key] ? block : '';
    });


    // Handle simple {{key}} replacements
    output = output.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
        const keys = key.split('.');
        let value: any = data;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return ''; // Key not found, replace with empty string
            }
        }
        return String(value);
    });

    return output;
}
