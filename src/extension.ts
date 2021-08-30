import { privateEncrypt } from 'crypto';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gogo', () => {
			cmdGogo();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotoline', () => {
			cmdGotoLine();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotoleft', () => {
			cmdGotoLeft();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotoright', () => {
			cmdGotoRight();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotoleftbracketouter', () => {
			cmdGotoLeftBracketOuter();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('go-go-my-cursor.gotorightbracketouter', () => {
			cmdGotoRightBracketOuter();
		})
	);
}

export function deactivate() { }


function cmdGogo()
{
	vscode.window.showInputBox().then(cmd => {
		if (!cmd) { return; }
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		
		let tokens = cmd.split(" ");
		if (tokens.length === 1) {
			if (isNumber(tokens[0])) {
				moveCursorToLineEnd(edi, Number(tokens[0]));
			} else {
				let line = edi.selection.active.line;
				let word = tokens[0].toLowerCase();
				gotoLineAndWord(edi, line, word, "l");
			}
		} else if (tokens.length === 2) {
			if (isNumber(tokens[0])) {
				let line = Number(tokens[0]) - 1;
				let word = tokens[1].toLowerCase();
				gotoLineAndWord(edi, line, word, "l");
			} else {
				let line = edi.selection.active.line;
				let dir = tokens[0];
				let word = tokens[1].toLowerCase();
				gotoLineAndWord(edi, line, word, dir);
			}
		} else if (tokens.length === 3) {
			let line = Number(tokens[0]) - 1;
			let dir = tokens[1];
			let word = tokens[2].toLowerCase();
			gotoLineAndWord(edi, line, word, dir);
		}
	});
}

function isNumber(s: string) : boolean
{
	for (let i = 0; i < s.length; ++i) {
		if (s[i] < '0' || s[i] > '9') {
			return false;
		}
	}
	return true;
}


function gotoLineAndWord(edi: vscode.TextEditor, line: number, word: string, dir: string)
{
	if (dir === "r") {
		gotoLineAndWordRight(edi, line, word);
	} else {
		gotoLineAndWordLeft(edi, line, word);
	}
}


function gotoLineAndWordLeft(edi: vscode.TextEditor, line: number, word: string)
{
	let kmpTb = buildKmpTb(word);
	
	let s = edi.document.lineAt(line).text.toLowerCase();
	if (s.length > 0) {
		let foundIdx = searchStr(s, 0, word, kmpTb);
		if (foundIdx !== -1) {
			moveCursor(edi, line, foundIdx-word.length+1);
		} else {
			moveCursor(edi, line, s.length - 1);
		}
	} else {
		moveCursor(edi, line, 0);
	}
}

function gotoLineAndWordRight(edi: vscode.TextEditor, line: number, word: string)
{
	word = word.split("").reverse().join("");
	let kmpTb = buildKmpTb(word);
	
	let s = edi.document.lineAt(line).text.toLowerCase();
	if (s.length > 0) {
		let foundIdx = searchStrBackward(s, s.length-1, word, kmpTb);
		if (foundIdx !== -1) {
			moveCursor(edi, line, foundIdx);
		} else {
			moveCursor(edi, line, s.length - 1);
		}
	} else {
		moveCursor(edi, line, 0);
	}
}


function cmdGotoLine()
{
	vscode.window.showInputBox().then(line => {
		if (!line) { return; }
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		
		moveCursorToLineEnd(edi, Number(line));
	});
}

function cmdGotoLeft()
{
	vscode.window.showInputBox().then(tar => {
		if (!tar) { return; }
		tar = tar.split("").reverse().join("");
		
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		tar = tar.toLowerCase();
		let kmpTb = buildKmpTb(tar);
		
		let pos = edi.selection.active;
		
		let s = edi.document.lineAt(pos.line).text.toLowerCase();
		if (s.length > 0 && pos.character > 0) {
			let foundIdx = searchStrBackward(s, pos.character - 1, tar, kmpTb);
			if (foundIdx !== -1) {
				moveCursor(edi, pos.line, foundIdx);
				return;
			}
		}
		for (let lineIdx = pos.line - 1; lineIdx >= 0; --lineIdx)
		{
			let s = edi.document.lineAt(lineIdx).text;
			if (s.length > 0) {
				let foundIdx = searchStrBackward(s, s.length-1, tar, kmpTb);
				if (foundIdx !== -1) {
					moveCursor(edi, lineIdx, foundIdx);
					return;
				}
			}
		}
	});
}

function cmdGotoRight()
{
	vscode.window.showInputBox().then(tar => {
		if (!tar) { return; }
		let edi = vscode.window.activeTextEditor;
		if (!edi) { return; }
		tar = tar.toLowerCase();
		let kmpTb = buildKmpTb(tar);
		
		let pos = edi.selection.active;
		
		let s = edi.document.lineAt(pos.line).text.toLowerCase();
		if (s.length > 0) {
			let foundIdx = searchStr(s, pos.character+1, tar, kmpTb);
			if (foundIdx !== -1) {
				moveCursor(edi, pos.line, foundIdx-tar.length+1);
				return;
			}
		}
		let lineCnt = edi.document.lineCount;
		for (let lineIdx = pos.line + 1; lineIdx < lineCnt; ++lineIdx)
		{
			let s = edi.document.lineAt(lineIdx).text;
			if (s.length > 0) {
				let foundIdx = searchStr(s, 0, tar, kmpTb);
				if (foundIdx !== -1) {
					moveCursor(edi, lineIdx, foundIdx-tar.length+1);
					return;
				}
			}
		}
	});
}

enum PosDirection {
	left, right
}

function cmdGotoLeftBracketOuter() {
	GotoBracketOuter(PosDirection.left);
}

function cmdGotoRightBracketOuter() {
	GotoBracketOuter(PosDirection.right);
}

function GotoBracketOuter(direction: PosDirection) {
	let edi = vscode.window.activeTextEditor;
	if (!edi) { return; }
	let pos = edi.selection.active;
	if (direction === PosDirection.left) {
		pos = mvPos(direction, pos, edi)[1];
	}
	let tars = new Set<string>();
	tars.add("'").add("\"").add("{").add("}").add("(").add(")").add("<").add(">").add("[").add("]");
	
	while (true) {
		let ch = edi.document.lineAt(pos.line).text.charAt(pos.character);
		if (tars.has(ch)) break;
		
		let [is_change, new_pos] = mvPos(direction, pos, edi);
		if (!is_change) return;
		pos = new_pos;
	}
	if (direction === PosDirection.right) {
		pos = mvPos(direction, pos, edi)[1];
	}
	moveCursor(edi, pos.line, pos.character);
}


function mvPos(direction: PosDirection, pos: vscode.Position, edi: vscode.TextEditor): [boolean, vscode.Position] {
	let new_pos;
	if (direction === PosDirection.left) {
		new_pos = mvPosLeft(pos, edi);
	} else {
		new_pos = mvPosRight(pos, edi);
	}
	let is_change = pos.line != new_pos.line || pos.character != new_pos.character;
	return [is_change, new_pos];
}

function mvPosRight(pos: vscode.Position, edi: vscode.TextEditor) : vscode.Position {
	let line_end = edi.document.lineAt(pos.line).range.end;
	if (pos.line === line_end.line && pos.character === line_end.character) {
		if (pos.line < edi.document.lineCount - 1) {
			return new vscode.Position(pos.line + 1, 0);
		} else {
			return pos;
		}
	} else {
		return new vscode.Position(pos.line, pos.character + 1);
	}
}

function mvPosLeft(pos: vscode.Position, edi: vscode.TextEditor) : vscode.Position {
	if (pos.character === 0) {
		if (pos.line > 0) {
			return edi.document.lineAt(pos.line-1).range.end;
		} else {
			return pos;
		}
	} else {
		return new vscode.Position(pos.line, pos.character - 1);
	}
}

function moveCursor(edi: vscode.TextEditor, line: number, idx: number)
{
	line = Math.max(0, Math.min(line, edi.document.lineCount-1));
	let tarPos = new vscode.Position(line, idx);
	let range = new vscode.Range(tarPos, tarPos);
	edi.selection = new vscode.Selection(tarPos, tarPos);
	edi.revealRange(range);
}

function moveCursorToLineEnd(edi: vscode.TextEditor, line: number)
{
	let number = Math.max(0, Math.min(line - 1, edi.document.lineCount-1));
	let range = edi.document.lineAt(number).range;
	edi.selection = new vscode.Selection(range.end, range.end);
	edi.revealRange(range);
}

function searchStr(s: string, startIdx: number, tar: string, kmpTb: Array<number>): number
{
	let ti = 0;
	for (let si = startIdx; si < s.length; ++si)
	{
		if (s[si] === tar[ti]) {
			++ti;
			if (ti === tar.length) { return si; }
		} else {
			while (ti > 0 && s[si] !== tar[ti]) {
				ti = kmpTb[ti];
			}
			if (s[si] === tar[ti]) { ++ti; }
		}
	}
	return -1;
}

function searchStrBackward(s: string, startIdx: number, tar: string, kmpTb: Array<number>) : number
{
	let ti = 0;
	for (let si = startIdx; si >= 0; --si)
	{
		if (s[si] === tar[ti]) {
			++ti;
			if (ti === tar.length) { return si; }
		} else {
			while (ti > 0 && s[si] !== tar[ti]) {
				ti = kmpTb[ti];
			}
			if (s[si] === tar[ti]) { ++ti; }
		}
	}
	return -1;
}

function buildKmpTb(s: string) : Array<number>
{
	let tb = Array<number>(s.length).fill(0);
	let matchIdx = 0;
	for (let i = 1; i < s.length; ++i)
	{
		while (matchIdx > 0 && s[i] !== s[matchIdx]) {
			matchIdx = tb[matchIdx];
		}
		if (s[i] === s[matchIdx]) {
			++matchIdx;
			if (i + 1 < tb.length) {
				tb[i + 1] = matchIdx;
			}
		}
	}
	return tb;
}

