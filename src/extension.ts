import { privateEncrypt } from 'crypto';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotoline', () => {
			cmd_gotoline();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotoleft', () => {
			cmd_gotoleft();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotoright', () => {
			cmd_gotoright();
		})
	);
}

export function deactivate() { }


function cmd_gotoline()
{
	vscode.window.showInputBox().then(line => {
		if (!line) { return; }
		let editor = vscode.window.activeTextEditor;
		if (!editor) { return; }
		
		let number = Math.max(0, Math.min(Number(line) - 1, editor.document.lineCount-1));
		let range = editor.document.lineAt(number).range;
		editor.selection = new vscode.Selection(range.end, range.end);
		editor.revealRange(range);
	});
}

function cmd_gotoleft()
{
	vscode.window.showInputBox().then(tar => {
		if (!tar) { return; }
		tar = tar.split("").reverse().join("");
		
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		let kmp_tb = build_kmp_tb(tar);
		
		let pos = edi.selection.active;
		
		let s = edi.document.lineAt(pos.line).text;
		if (s.length > 0 && pos.character > 0) {
			let found_i = search_str_backward(s, pos.character - 1, tar, kmp_tb);
			if (found_i != -1) {
				move_cursor(edi, pos.line, found_i);
				return;
			}
		}
		for (let line_i = pos.line - 1; line_i >= 0; --line_i)
		{
			let s = edi.document.lineAt(line_i).text;
			if (s.length > 0) {
				let found_i = search_str_backward(s, s.length-1, tar, kmp_tb);
				if (found_i != -1) {
					move_cursor(edi, line_i, found_i);
					return;
				}
			}
		}
	});
}

function cmd_gotoright()
{
	vscode.window.showInputBox().then(tar => {
		if (!tar) { return; }
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		let kmp_tb = build_kmp_tb(tar);
		
		let pos = edi.selection.active;
		
		let s = edi.document.lineAt(pos.line).text;
		if (s.length > 0) {
			let found_i = search_str(s, pos.character+1, tar, kmp_tb);
			if (found_i != -1) {
				move_cursor(edi, pos.line, found_i-tar.length+1);
				return;
			}
		}
		let line_cnt = edi.document.lineCount;
		for (let line_i = pos.line + 1; line_i < line_cnt; ++line_i)
		{
			let s = edi.document.lineAt(line_i).text;
			if (s.length > 0) {
				let found_i = search_str(s, 0, tar, kmp_tb);
				if (found_i != -1) {
					move_cursor(edi, line_i, found_i-tar.length+1);
					return;
				}
			}
		}
	});
}

function move_cursor(edi: vscode.TextEditor, line: number, idx: number)
{
	let tar_pos = new vscode.Position(line, idx);
	let range = new vscode.Range(tar_pos, tar_pos);
	edi.selection = new vscode.Selection(tar_pos, tar_pos);
	edi.revealRange(range);
}

function search_str(s: string, start_idx: number, tar: string, kmp_tb: Array<number>): number
{
	let ti = 0;
	for (let si = start_idx; si < s.length; ++si)
	{
		if (s[si] == tar[ti]) {
			++ti;
			if (ti == tar.length) { return si; }
		} else {
			while (ti > 0 && s[si] != tar[ti]) {
				ti = kmp_tb[ti];
			}
			if (s[si] == tar[ti]) { ++ti; }
		}
	}
	return -1;
}

function search_str_backward(s: string, start_idx: number, tar: string, kmp_tb: Array<number>) : number
{
	let ti = 0;
	for (let si = start_idx; si >= 0; --si)
	{
		if (s[si] == tar[ti]) {
			++ti;
			if (ti == tar.length) { return si; }
		} else {
			while (ti > 0 && s[si] != tar[ti]) {
				ti = kmp_tb[ti];
			}
			if (s[si] == tar[ti]) { ++ti; }
		}
	}
	return -1;
}

function build_kmp_tb(s: string) : Array<number>
{
	let tb = Array<number>(s.length).fill(0);
	let match_i = 0;
	for (let i = 1; i < s.length; ++i)
	{
		while (match_i > 0 && s[i] != s[match_i]) {
			match_i = tb[match_i];
		}
		if (s[i] == s[match_i]) {
			++match_i;
			if (i + 1 < tb.length) {
				tb[i + 1] = match_i;
			}
		}
	}
	return tb;
}