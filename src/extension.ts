import { privateEncrypt } from 'crypto';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gogo', () => {
			cmd_gogo();
		})
	);
	
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


function cmd_gogo()
{
	vscode.window.showInputBox().then(cmd => {
		if (!cmd) { return; }
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		
		let tokens = cmd.split(" ");
		if (tokens.length == 1) {
			if (is_number(tokens[0])) {
				move_cursor_to_line_end(edi, Number(tokens[0]));
			} else {
				let line = edi.selection.active.line;
				let word = tokens[0].toLowerCase();
				goto_line_and_word(edi, line, word, "l");
			}
		} else if (tokens.length == 2) {
			if (is_number(tokens[0])) {
				let line = Number(tokens[0]) - 1;
				let word = tokens[1].toLowerCase();
				goto_line_and_word(edi, line, word, "l");
			} else {
				let line = edi.selection.active.line;
				let dir = tokens[0];
				let word = tokens[1].toLowerCase();
				goto_line_and_word(edi, line, word, dir);
			}
		} else if (tokens.length == 3) {
			let line = Number(tokens[0]) - 1;
			let dir = tokens[1];
			let word = tokens[2].toLowerCase();
			goto_line_and_word(edi, line, word, dir);
		}
	});
}

function is_number(s: string) : boolean
{
	for (let i = 0; i < s.length; ++i) {
		if (s[i] < '0' || s[i] > '9') {
			return false;
		}
	}
	return true;
}


function goto_line_and_word(edi: vscode.TextEditor, line: number, word: string, dir: string)
{
	if (dir == "r") {
		goto_line_and_word_right(edi, line, word);
	} else {
		goto_line_and_word_left(edi, line, word);
	}
}


function goto_line_and_word_left(edi: vscode.TextEditor, line: number, word: string)
{
	let kmp_tb = build_kmp_tb(word);
	
	let s = edi.document.lineAt(line).text.toLowerCase();
	if (s.length > 0) {
		let found_i = search_str(s, 0, word, kmp_tb);
		if (found_i != -1) {
			move_cursor(edi, line, found_i-word.length+1);
		} else {
			move_cursor(edi, line, s.length - 1);
		}
	} else {
		move_cursor(edi, line, 0);
	}
}

function goto_line_and_word_right(edi: vscode.TextEditor, line: number, word: string)
{
	word = word.split("").reverse().join("");
	let kmp_tb = build_kmp_tb(word);
	
	let s = edi.document.lineAt(line).text.toLowerCase();
	if (s.length > 0) {
		let found_i = search_str_backward(s, s.length-1, word, kmp_tb);
		if (found_i != -1) {
			move_cursor(edi, line, found_i);
		} else {
			move_cursor(edi, line, s.length - 1);
		}
	} else {
		move_cursor(edi, line, 0);
	}
}


function cmd_gotoline()
{
	vscode.window.showInputBox().then(line => {
		if (!line) { return; }
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		
		move_cursor_to_line_end(edi, Number(line));
	});
}

function cmd_gotoleft()
{
	vscode.window.showInputBox().then(tar => {
		if (!tar) { return; }
		tar = tar.split("").reverse().join("");
		
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		tar = tar.toLowerCase();
		let kmp_tb = build_kmp_tb(tar);
		
		let pos = edi.selection.active;
		
		let s = edi.document.lineAt(pos.line).text.toLowerCase();
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
		tar = tar.toLowerCase();
		let kmp_tb = build_kmp_tb(tar);
		
		let pos = edi.selection.active;
		
		let s = edi.document.lineAt(pos.line).text.toLowerCase();
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
	line = Math.max(0, Math.min(line, edi.document.lineCount-1));
	let tar_pos = new vscode.Position(line, idx);
	let range = new vscode.Range(tar_pos, tar_pos);
	edi.selection = new vscode.Selection(tar_pos, tar_pos);
	edi.revealRange(range);
}

function move_cursor_to_line_end(edi: vscode.TextEditor, line: number)
{
	let number = Math.max(0, Math.min(line - 1, edi.document.lineCount-1));
	let range = edi.document.lineAt(number).range;
	edi.selection = new vscode.Selection(range.end, range.end);
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