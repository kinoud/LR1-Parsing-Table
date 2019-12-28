window.onload = main;

let nonTerminal = '';
let terminal = '';
let grammerSymbol = '';
let productions = [];
let fi = {};
let I0 = new Set();
/**
 * The only start symbol of parsing table.
 */
let S_;
/**
 * Set of (set of items).
 */
let C = new Set();
/**
 * Map string-encoded setOfItems to a unique id.
 */
let stateID = new Map();
let gotoTable = new Array();
let parsingTable = new Array();

//private
let spliter00 = '-->';
let spliter01 = ' @ ';
let reserveCharacters = '$@'

/**
 * This should be a const object.
 * @param {number} id 
 * @param {string} lhs 
 * @param {string} rhs 
 */
function Production(id, lhs, rhs) {
	let prototype = {
		id: id,
		lhs: lhs,
		rhs: rhs,
		rlen: rhs=='@'?0:rhs.length,
		getSuffix(i) {
			if (i.toString() === i)
				alert('error2 "i" is expected to be an integer but a string!');
			return this.rhs.substr(i);
		}
	};
	for (let name in prototype) this[name] = prototype[name];
}

/**
 * 
 * @param {Production} p 
 * @param {number} idx 
 * @param {string} tail 
 */
function Item(p, idx, tail) {
	let prototype = {
		p: p,
		idx: idx,
		tail: tail,
		fromStr(s) {

			let ele = s.split(spliter01);
			this.p = productions[ele[0]];
			this.idx = parseInt(ele[1]);
			this.tail = ele[2];
			return;
		},
		getNext() {
			//debugger;
			return this.idx == this.p.rlen ? '$' : this.p.rhs[this.idx];
		},
		getSuffix(i) {
			return this.p.getSuffix(i);
		},
		string() {
			return this.p.id + spliter01 + this.idx + spliter01 + this.tail;
		}
	};
	for (let name in prototype) this[name] = prototype[name];
}

/**
 * @param {Set} set Set of items.
 * @returns {string} Set of items.
 */
function SetOfItems(set) {
	let ans = '';
	let a = new Array();
	for (s of set)
		a.push(s);
	a.sort();
	for (s of a)
		ans += s + '\n';
	return ans.substr(0, ans.length - 1);
}


let alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
let availIndex = 0;
let encodeMap = {}, decodeMap = {};

/**
 * @param {string} word A word.
 * @return {string} A single character corresponding to this word.
 */
function getWordEncode(word) {
	if(word=='')return '@';
	if (!encodeMap[word]) {
		if (!grammerBeingSet)
			alert('error5 Cannot recognize "' + word + '"');
		let x = alphabet[availIndex++];
		if (!x) alert('error3');
		encodeMap[word] = x;
		decodeMap[x] = word;
	}
	return encodeMap[word];
}

/**
 * @param {string} x A single character.
 * @return {string} A word to which x corresponds.
 */
function getWordDecode(x) {
	if(x=='@')return '';
	if (reserveCharacters.indexOf(x) != -1) return x;
	return decodeMap[x];
}


let mark2Id = {};
/**
 * @param {string} lhs A word.
 * @param {string} rhs Words sperated with ' '(white space).
 * @param {any} mark Used when configuring setting up a grammer.
 */
function addProduction(lhs, rhs, mark) {
	let id = productions.length;
	mark2Id[mark] = id;
	let list = rhs.split(' ');
	list = list.filter(e => { return e != ''; });
	rhs = '';
	for (let w of list)
		rhs += getWordEncode(w);
	if(rhs=='')rhs=getWordEncode(rhs);
	lhs = getWordEncode(lhs);
	productions[id] = new Production(id, lhs, rhs);
	document.getElementById('info').innerHTML+=translate(lhs)+'-->'+translate(rhs)+'</br>';
}

/**
 * Make I=CLOSURE(I) and returns I.
 * @param {Set} I Set of items.
 */
function CLOSURE(I) {
	while (1) {
		let sz = I.size;
		for (let s of I) {

			let it = new Item();
			it.fromStr(s);
			let B = it.getNext();
			//debugger;
			if (isTerminal(B))
				continue;
			let beta = it.getSuffix(it.idx + 1);
			for (let i in productions) {
				let p = productions[i];
				if (p.lhs != B)
					continue;
				for (let b of getFirstSet(beta + it.tail))
					if (b != '@')
						I.add((new Item(p, 0, b)).string());
			}
			//debugger;
		}
		//debugger;
		if (I.size == sz)
			break;
	}
	return I;
}

/**
 * @param {string} I items(string encoded) seperated with '\n'
 * @param {string} X a symbol
 * @returns {string} Set of Items.
 */
function GOTO(I, X) {
	let J = new Set();
	I = I.split('\n');
	for (let s of I) {
		it = new Item();
		it.fromStr(s);
		N = it.getNext();
		if (N == X) {
			it.idx += 1;
			J.add(it.string());
		}
	}
	return SetOfItems(CLOSURE(J));
}

/**
 * Note that '@$' is also considered as terminal.
 * @param {string} x Symbol.
 */
function isTerminal(x) {
	return nonTerminal.indexOf(x) == -1;
}

/**
 * @param {string} s A string mixed with terminals and non-terminals.
 * @returns {Set<string>} Set of terminals.
 */
function getFirstSet(s) {
	let ans = new Set();
	for (let x of s) {
		if (!isTerminal(x)) {
			for (let o of fi[x])
				ans.add(o);
			if (!fi[x].has('@'))
				break;
		} else if (x != '@') {
			ans.add(x);
			break;
		}
	}
	if (ans.size == 0)
		ans.add('@');
	return ans;
}

/**
 * Generate first(x) for every non-terminal x from productions.
 */
function FIRST() {
	fi = {};
	for (let idx of nonTerminal)
		fi[idx] = new Set();
	while (1) {
		let change = false;
		for (let i in productions) {
			let p = productions[i];
			//debugger;
			let L = p.lhs;
			if (isTerminal(L))
				alert("error1");
			for (let i in p.rhs) {
				let R = p.rhs[i];
				let len = fi[L].size;
				if (isTerminal(R)) {
					fi[L].add(R);
					if (len != fi[L].size)
						change = true;
					break;
				}
				let epsL = fi[L].has('@');

				fi[L] = new Set([...fi[L], ...fi[R]]);//union

				if (i < p.rhs.size - 1 && !epsL)
					fi[L].delete('@');//@ stands for eps

				//debugger;
				if (len != fi[L].size)
					change = true;

				let epsR = fi[R].has('@');
				if (!epsR) break;

			}
		}
		if (!change)
			break;
	}
}


let grammerBeingSet = false;
/**
 * @param {string} Ts Terminals splited with ' '.
 * @param {string} Ns Non-terminals splited with ' '.
 * @param {string} S Start-symbol.
 */
function setSymbol(Ts, Ns, S) {
	let buff='';
	buff+='<note>Terminals:</note></br>'+Ts+'</br>';
	buff+='<note>Non-terminals:</note></br>'+Ns+'</br>';
	buff+='<note>Start symbol:</note></br>'+S+'</br>';
	buff+='<note>Productions:</note></br>';
	document.getElementById('info').innerHTML=buff;

	grammerBeingSet = true;
	let check = Ts + Ns + S;
	for (let x of check) if (reserveCharacters.indexOf(x) != -1) alert('error4');
	setTerminal('$');
	for (let T of Ts.split(' '))
		setTerminal(T);
	for (let N of Ns.split(' '))
		setNonTerminal(N);
	S_ = S + "'";
	setNonTerminal(S_);
	addProduction(S_, S);
	let item0 = new Item(productions[0], 0, '$');
	I0.add(item0.string());
	grammerBeingSet = false;
}

function setTerminal(x) {
	if (x == '') return;
	let e = getWordEncode(x);
	if (terminal.indexOf(e) != -1) return;
	terminal += e;
	grammerSymbol += e;
}

function setNonTerminal(x) {
	if (x == '') return;
	let e = getWordEncode(x);
	if (nonTerminal.indexOf(e) != -1) return;
	nonTerminal += e;
	grammerSymbol += e;
}

function reformState(s) {
	let list = s.split('\n');
	list.sort();
	for (let i in list) {
		let it = new Item();
		it.fromStr(list[i]);
		list[i] = it;
	}
	for (let i = 0; i + 1 < list.length; i++) {
		if (list[i].p.id == list[i + 1].p.id && list[i].idx == list[i + 1].idx) {
			list[i + 1].tail += list[i].tail;
			list[i].tail = '';
		}
	}
	list = list.filter(e => { return e.tail != ''; });
	s = '';
	for (let i in list) {
		let it = list[i];

		let buff1 = getWordDecode(it.p.lhs);
		buff1 += spliter00;
		for (let i=0;i<it.p.rlen;i++) {
			if (i == it.idx)
				buff1 += ' .';
			buff1 += ' ' + getWordDecode(it.p.rhs[i]);
		}
		if (it.idx == it.p.rlen)
			buff1 += ' .';

		let buff2 = '';
		for (let x of it.tail) {
			buff2 += ' ' + getWordDecode(x);
		}

		s += buff1 + '&nbsp;&nbsp; <note>{</note>' + buff2 + ' <note>}</note>';

		if (parseInt(i) + 1 < list.length)
			s += '\n';
	}
	return s;
}

/**
 * @param {string} s A sentence each character of which is an encoded symbol.
 */
function translate(s) {
	let ans = '';
	for (let x of s)
		ans += ' ' + getWordDecode(x);
	return ans;
}

/**
 * 
 * @param {Production} p 
 */
function decodeProduction(p) {
	let L = getWordDecode(p.lhs);
	let R = translate(p.rhs);
	return L + '-->' + R;
}

function writeGotoTable(u, e, type, v) {
	let de = getWordDecode(e);
	let act, dscp;
	if (type == 'shift') {
		dscp = 'shift ' + v;
		act = 's' + v;
	} else if (type == 'reduce') {
		dscp = 'reduce ' + decodeProduction(v);
		act = 'r' + v.id;
	} else {
		dscp = type;
		act = 'acc';
	}
	if (gotoTable[u][de]) {
		if (type == 'accept') {
			gotoTable[u][de] = dscp;
			parsingTable[u][de] = act;
			return;
		}

		let loser = gotoTable[u][de];
		if (type != 'reduce') alert('error358 I have no idea why type=' + type + '(it should be reduce)');
		console.log('Conflict: I' + u + ' reads "' + de + '" then "' + gotoTable[u][de] + '">>>>"' + dscp + '"');

		//gotoTable[u][de]+='////'+dscp;
		//return;

		if (isReduceGranted(e, v.id)) {
			gotoTable[u][de] = dscp;
			parsingTable[u][de] = act;
			console.log('Reduce granted.');
		} else {
			loser = dscp;
			console.log('Reduce rejected.');
		}

		gotoTable[u][de] += ' <s>' + loser + '</s>';

	} else {
		gotoTable[u][de] = dscp;
		parsingTable[u][de] = act;
	}
}

function drawStates(){

	function genTrans(list) {
		let ans = '';
		for (let s in list) {
			let e = list[s].replace('////', '<note>/</note>');
			e = e.replace(/(accept|reduce|shift)/g, '<keyword>$1</keyword>');
			ans += '<stress>' + s + '</stress>' + '<note> --- </note>' + e + '</br>';
		}
		return ans;
	}
	//draw states
	let dom_state = document.getElementById("state");
	let buff = '';
	for (let state_id of stateID.entries()) {
		let id = state_id[1];
		let state = reformState(state_id[0]);
		buff += '<div id=\'' + 'I' + id + '\'>';
		buff += 'I' + id + '</br>' + state.replace(/\n/g, '</br>');
		buff += '</br><div class="trans">';
		buff += '<stress>Transition for this state:</stress></br>';
		buff += genTrans(gotoTable[id]);
		buff += '</div></div>';
	}
	buff += '';
	dom_state.innerHTML = buff;
}


function main() {
	setupGrammer();
	FIRST();
	CLOSURE(I0);
	C.add(SetOfItems(I0));
	while (1) {
		let sz = C.size;
		for (let I of C) {
			for (let X of grammerSymbol) {
				let J = GOTO(I, X);
				if (J != '')
					C.add(J);
			}
		}
		if (sz == C.size)
			break;
	}

	//label each state(string)
	let id = 1;
	for (let s of C) {
		if (s == SetOfItems(I0))
			stateID.set(SetOfItems(I0), 0);
		else
			stateID.set(s, id++);
	}


	//re-compute goto with labels
	//and fill gotoTable

	for (let i = 0; i < id; i++) {
		gotoTable.push({});
		parsingTable.push({});
	}



	for (let I of C) {
		//I is of string type
		let u = stateID.get(I);
		II = I.split('\n');
		for (let X of grammerSymbol) {
			let J = GOTO(I, X);
			/**
			 * The order of the judgements of 'shift' and 'reduce' cannot be changed.
			 * Because when a shift-reduce conflict happens,
			 * there will be a 'shift' action which holds and a 'reduce' action
			 * which comes up.
			 * Then whether to grant reduce is decided.
			 */
			if (J != '') {
				//shift
				let v = stateID.get(J);
				writeGotoTable(u, X, 'shift', v);
			}
			if (isTerminal(X)) {
				//maybe reduce
				for (let s of II) {
					let it = new Item();
					it.fromStr(s);
					if (it.tail == X && it.getNext() == '$') {
						writeGotoTable(u, X, 'reduce', it.p);
						//we assume there's no conflict (that is not always true)
						break;
					}
				}
			}
		}
		for (let s of II) {
			let it = new Item();
			it.fromStr(s);
			if (it.tail == '$' && it.getNext() == '$') {
				writeGotoTable(u, '$', 'reduce', it.p);
				if (it.p.lhs == getWordEncode(S_))
					writeGotoTable(u, '$', 'accept');
				break;
			}
		}
	}

	drawStates();

	document.getElementById('btn').addEventListener('click', e => {
		parseLR1(document.getElementById('in').value);
	});

	console.log('gotoTable:');
	console.log(gotoTable);
	console.log('parsingTable:');
	console.log(parsingTable);
}


/**
 * @param {string} x Symbol which is encoded. 
 * @param {number} id Production ID.
 */
function isReduceGranted(x, id) {
	if (!grantReduceBuff[x]) return false;
	if (!grantReduceBuff[x][id]) return false;
	return true;
}
let grantReduceBuff = [];
/**
 * When conflict between 'reads x then shift' and 'reads x then reduce p' happens,
 * should we grant priority to reduce action?
 * This function sets such hits. By default we choose 'shift' action.
 * @param {[string]} slist Symbols.
 * @param {[number]} mlist Marks of productions.
 */
function grantReduce(slist, mlist) {
	for (let s of slist) {
		s = getWordEncode(s);
		if (!grantReduceBuff[s])
			grantReduceBuff[s] = [];
		for (let m of mlist)
			grantReduceBuff[s][mark2Id[m]] = true;
	}
}

/**
 * @param {string} text Tokens to be parsed sperated with ' '.
 * End marker '$' is not allowed since we will append it later.
 */
function parseLR1(text) {
	document.getElementById('result').innerHTML = '';
	//preprocess
	text += ' $';
	text = text.replace(/[\n\t]/g, ' ');
	let toks = text.split(' ');
	toks = toks.filter(e => { return e != ''; });
	for (let i in toks)
		toks[i] = getWordEncode(toks[i]);
	//preprocess ends
	let cur = 0;
	let state = 0;
	let stack = [0], top = 0;
	let rec = [];

	function shift(word) {
		let act = parsingTable[state][word];
		if (act[0] != 's') alert('error585');
		let nxt = parseInt(act.substr(1));
		stack[++top] = nxt;
		state = nxt;
	}
	while (1) {
		let word = getWordDecode(toks[cur]);
		let act = parsingTable[state][word];
		if(!word||!act){
			alert('error604 Parsing failed!');
			return;
		}
		if (act[0] == 's') {
			shift(word);
			cur++;
			if (productions[-1]) alert('error558');
			rec.push(-1);
		} else if (act[0] == 'r') {
			let p = parseInt(act.substr(1));
			top -= productions[p].rlen;
			state = stack[top];
			rec.push(p);
			shift(getWordDecode(productions[p].lhs));
		} else if (act[0] == 'a') {
			break;
		} else {
			alert('error621');
			return;
		}
	}
	let idx = rec.length - 1;
	let symbols = productions[rec[idx]].lhs, input = '';
	let buff = '';
	//let childIdx=0, childLen=0;
	for (; idx >= 0; idx--) {
		//debugger;
		if (rec[idx] >= 0) {
			let len = symbols.length;
			let p = productions[rec[idx]];
			let last = symbols[len - 1];
			symbols = symbols.substr(0, len - 1);
			//console.log(translate(symbols)+'<note>'+translate(last)+'</note>'+translate(input));

			buff += translate(symbols) + '<b>' + translate(last) + '</b>' + translate(input);
			buff += '<br/>-->'
			
			//childIdx=symbols.length+1;
			//childLen=p.rlen;
			/**
			 * When p.rlen=0 p.rhs holds '@', we will not append '@' to symbols.
			 */
			if(p.rlen>0)symbols += p.rhs;

		} else {
			input = toks[--cur] + input;
			symbols = symbols.substr(0, symbols.length - 1);
		}
		
	}
	//console.log(translate(symbols)+translate(input));
	buff += translate(symbols) + translate(input);
	document.getElementById('result').innerHTML = buff;
}


/**
 * Set up a grammer for which you should decide <T,N,S,P> which means
 * <Terminals,Non-terminals,Start-symbol,Productions>.
 */
function setupGrammer() {
	
	/*
	setSymbol('a','S A','S');
	addProduction('S','S A');
	addProduction('S','');
	addProduction('A','a');
	return;
	*/
	setSymbol(
		'id number + - * / , ; classtype = relop if else for while { } ( ) [ ]',
		'program fdef paramlist fcall arglist expr decl assignmt simplestmt stmtblock ctrlstmt ifstmt forstmt whilestmt',
		'program'
	);
	addProduction('program','fdef');
	addProduction('program','program fdef');
	addProduction('fdef','classtype id ( paramlist ) { stmtblock }');
	addProduction('paramlist','paramlist , decl');
	addProduction('paramlist','decl');
	addProduction('paramlist','');
	addProduction('expr', 'id');
	addProduction('expr', 'number');
	addProduction('expr', 'fcall');
	addProduction('fcall', 'id ( arglist )');
	addProduction('arglist', 'arglist , expr');
	addProduction('arglist', 'expr');
	addProduction('arglist','');
	addProduction('expr', 'expr relop expr', 1);
	addProduction('expr', 'expr + expr', 2);
	addProduction('expr', 'expr - expr', 3);
	addProduction('expr', 'expr * expr', 4);
	addProduction('expr', 'expr / expr', 5);
	addProduction('expr', '( expr )');
	addProduction('decl', 'classtype id');
	addProduction('decl', 'classtype id = expr');
	addProduction('decl', 'classtype id [ number ]');
	addProduction('assignmt', 'id = expr');
	addProduction('assignmt','id [ expr ] = expr');
	addProduction('simplestmt', 'decl');
	addProduction('simplestmt', 'assignmt');
	addProduction('simplestmt', 'expr');
	addProduction('stmtblock','');
	//addProduction('stmtblock','{ stmtblock }');
	addProduction('stmtblock', 'stmtblock simplestmt ;');
	addProduction('stmtblock', 'simplestmt ;');
	addProduction('stmtblock', 'stmtblock ctrlstmt');
	addProduction('stmtblock', 'ctrlstmt')
	addProduction('ctrlstmt', 'ifstmt');
	addProduction('ctrlstmt', 'forstmt');
	addProduction('ctrlstmt', 'whilestmt');
	addProduction('ifstmt', 'if ( expr ) { stmtblock }');
	addProduction('ifstmt', 'ifstmt else { stmtblock }');
	addProduction('forstmt', 'for ( simplestmt ; expr ; simplestmt ) { stmtblock }')
	addProduction('whilestmt', 'while ( expr ) { stmtblock }');

	grantReduce(['*', '/'], [4, 5]);
	grantReduce(['+', '-'], [2, 3, 4, 5]);
	grantReduce(['relop'], [1, 2, 3, 4, 5]);
}