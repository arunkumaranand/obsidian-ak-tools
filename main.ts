import { MarkdownView, Notice, Plugin, moment } from 'obsidian';

// Remember to rename these classes and interfaces!

interface AkPluginSettings {
	akSetting: string;
}

const DEFAULT_SETTINGS: AkPluginSettings = {
	akSetting: 'default'
}

export default class AkPlugin extends Plugin {
	settings: AkPluginSettings;

	async onload() {
		await this.loadSettings();
		this.registerMarkdownCodeBlockProcessor(
			"ak-expenses",
			(source, el, ctx) => {
				// get the line number of the current code block
				const bockStartLine = ctx.getSectionInfo(el)?.lineStart ?? 0;

				console.log("bockStartLine", bockStartLine);

	
				// Create table
				const table = el.createEl("table", { cls: "expense-table" });
				const thead = table.createEl("thead");
				const headerRow = thead.createEl("tr");
				["Date", "Amount", "Details", "Actions"].forEach((header) => {
					headerRow.createEl("th", { text: header });
				});

				const tbody = table.createEl("tbody");

				// Add new entry row
				const newRow = tbody.createEl("tr", { cls: "new-entry-row" });
				const dateInput = newRow.createEl("td").createEl("input", {
					type: "number",
					placeholder: "Date (eg: 12)",
				});
				const amountInput = newRow.createEl("td").createEl("input", {
					type: "number",
					placeholder: "Amount",
				});
				const detailsInput = newRow.createEl("td").createEl("input", {
					type: "text",
					placeholder: "Details",
				});
				const addButton = newRow.createEl("td").createEl("button", {
					text: "+",
				});

				// Add styles
				el.createEl("style", {
					text: `
                    .expense-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1em 0;
                    }
                    .expense-table th, .expense-table td {
                        border: 1px solid var(--background-modifier-border);
                        padding: 8px;
                        text-align: left;
                    }
                    .expense-table input {
                        width: 100%;
                        border: none;
                        background: transparent;
                        color: var(--text-normal);
                    }
                    .expense-table button {
                        cursor: pointer;
                        padding: 4px 8px;
                        background: var(--interactive-accent);
                        color: var(--text-on-accent);
                        border: none;
                        border-radius: 4px;
                    }
                `,
				});

				// Add button click handler
				addButton.onclick = async () => {
					const date = dateInput.value;
					const amount = amountInput.value;
					const details = detailsInput.value;

					if (!date || !amount || !details) {
						new Notice("Please fill in all fields");
						return;
					}

					// make amount to be double digit precision
					const amountNum = parseFloat(amount).toFixed(2);

					// Get the current file's content
					const view =
						this.app.workspace.getActiveViewOfType(MarkdownView);
					if (!view) return;

					const editor = view.editor;
					const filename = view.file?.basename;

					// console.log(currentContent);

					const transaction_date = `${filename}-${date}`; // 2025-01-01
					const transaction_week_day = moment(transaction_date).format('ddd');

					// Save current scroll position and cursor position
					const scrollInfo = editor.getScrollInfo();
					const currentLine = editor.getCursor().line;

					// Create the position for insertion (right before the closing ```)
					const insertPosition = {
						line: bockStartLine,
						ch: 0,
					};

					// Add new entry to the document
					const newEntry = `| ${date} |  ${transaction_week_day} | ${amountNum} | ${details} |\n`;
					editor.replaceRange(newEntry, insertPosition);

					// Clear inputs
					dateInput.value = "";
					amountInput.value = "";
					detailsInput.value = "";

					// keep the focus on the code block
					// Restore cursor position
					editor.setCursor({ line: currentLine, ch: 0 });
					// Restore scroll position
					editor.scrollTo(scrollInfo.left, scrollInfo.top);
					
					// Optional: Keep focus on the date input for the next entry
					dateInput.focus();
				};
			}
		);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

