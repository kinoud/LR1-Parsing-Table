window.onload = main;

let nonTerminal='';
let terminal='';
let grammerSymbol='';
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

//private
let spliter00='-->';
let spliter01=' @ ';
let reserveCharacters='.$#'

function Production(id,lhs, rhs) {
	let prototype = {
		id:id,
		lhs: lhs,
		rhs: rhs,
		getSuffix(i){
			if(i.toString()===i)
				alert('error2 "i" is expected to be an integer but a string!');
			return this.rhs.substr(i);
		}
	};
	for (let name in prototype) this[name] = prototype[name];
}

function Item(p, idx, tail) {
	let prototype = {
		p: p,
		idx: idx,
		tail: tail,
		fromStr(s) {
			
			let ele=s.split(spliter01);
			this.p=productions[ele[0]];
			this.idx=parseInt(ele[1]);
			this.tail=ele[2];
			return;
		},
		getNext() {
			//debugger;
			let ans = this.idx == this.p.rhs.length ? '$' : this.p.rhs[this.idx];
			return ans == '#' ? '$' : ans;
		},
		getSuffix(i) {
			return this.p.getSuffix(i);
		},
		string() {
			return this.p.id+spliter01+this.idx+spliter01+this.tail;
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


let alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
let availIndex=0;
let encodeMap={},decodeMap={};

/**
 * @param {string} word A word.
 * @return {string} A single character corresponding to this word.
 */
function getWordEncode(word){
	if(!encodeMap[word]){
		if(!grammerBeingSet)
			alert('error5 Cannot recognize "'+word+'"');
		let x=alphabet[availIndex++];
		if(!x)alert('error3');
		encodeMap[word]=x;
		decodeMap[x]=word;
	}
	return encodeMap[word];
}

/**
 * @param {string} x A single character.
 * @return {string} A word to which x corresponds.
 */
function getWordDecode(x){
	if(reserveCharacters.indexOf(x)!=-1)return x;
	return decodeMap[x];
}






/**
 * @param {any} id Unique ID.
 * @param {string} lhs A word.
 * @param {string} rhs Words sperated with ' '(white space).
 */
function addProduction(id,lhs, rhs) {
	if(productions[id])alert('error133 id='+id+' already exists.');
	let list=rhs.split(' ');
	list=list.filter(e=>{return e!='';});
	rhs='';
	for(let w of list)
		rhs+=getWordEncode(w);
	lhs=getWordEncode(lhs);
	productions[id]=new Production(id,lhs, rhs);
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
			for (let p of productions) {
				if (p.lhs != B)
					continue;
				for (let b of getFirstSet(beta + it.tail))
					if (b != '#')
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
 * Note that '#$' is also considered as terminal.
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
			if (!fi[x].has('#'))
				break;
		} else if (x != '#') {
			ans.add(x);
			break;
		}
	}
	if(ans.size==0)
		ans.add('#');
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
		for (let p of productions) {
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
				let epsL = fi[L].has('#');
				
				fi[L] = new Set([...fi[L], ...fi[R]]);//union

				if (i < p.rhs.size - 1 && !epsL)
					fi[L].delete('#');//# stands for eps

				//debugger;
				if (len != fi[L].size)
					change = true;
				
				let epsR = fi[R].has('#');
				if(!epsR)break;

			}
		}
		if (!change)
			break;
	}
}


let grammerBeingSet=false;
/**
 * @param {string} Ts Terminals splited with ' '.
 * @param {string} Ns Non-terminals splited with ' '.
 * @param {string} S Start-symbol.
 */
function setSymbol(Ts,Ns,S){
	grammerBeingSet=true;
	let check=Ts+Ns+S;
	for(let x of check)if(reserveCharacters.indexOf(x)!=-1)alert('error4');
	for(let T of Ts.split(' '))
		setTerminal(T);
	for(let N of Ns.split(' '))
		setNonTerminal(N);
	S_=S+"'";
	setNonTerminal(S_);
	addProduction(0,S_,S);
	let item0=new Item(productions[0],0,'$');
	I0.add(item0.string());
	grammerBeingSet=false;
}

function setTerminal(x){
	if(x=='')return;
	let e=getWordEncode(x);
	if(terminal.indexOf(e)!=-1)return;
	terminal+=e;
	grammerSymbol+=e;
}

function setNonTerminal(x){
	if(x=='')return;
	let e=getWordEncode(x);
	if(nonTerminal.indexOf(e)!=-1)return;
	nonTerminal+=e;
	grammerSymbol+=e;
}

function reformState(s){
	let list=s.split('\n');
	list.sort();
	for(let i in list){
		let it=new Item();
		it.fromStr(list[i]);
		list[i]=it;
	}
	for(let i=0;i+1<list.length;i++){
		if(list[i].p.id==list[i+1].p.id&&list[i].idx==list[i+1].idx){
			list[i+1].tail+=list[i].tail;
			list[i].tail='';
		}
	}
	list=list.filter(e=>{return e.tail!='';});
	s='';
	for(let i in list){
		let it=list[i];
		
		let buff1=getWordDecode(it.p.lhs);
		buff1+=spliter00;
		for(let i in it.p.rhs){
			if(parseInt(i)==it.idx)
				buff1+=' .';
			buff1+=' '+getWordDecode(it.p.rhs[i]);
		}
		if(it.idx==it.p.rhs.length)
			buff1+=' .';

		let buff2='';
		for(let x of it.tail){
			buff2+=' '+getWordDecode(x);
		}
		
		s+=buff1+'&nbsp;&nbsp; <note>{</note>'+buff2+' <note>}</note>';
		
		if(parseInt(i)+1<list.length)
			s+='\n';
	}
	return s;
}

function decodeProduction(p){
	let L=getWordDecode(p.lhs);
	let R='';
	for(let x of p.rhs)
		R+=' '+getWordDecode(x);
	return L+'-->'+R;
}

function writeGotoTable(u,e,type,v){
	e=getWordDecode(e);
	if(type=='shift')v='shift '+v;
	else if(type=='reduce')v='reduce '+decodeProduction(v);
	else v=type;

	if(gotoTable[u][e]){
		gotoTable[u][e]+=' //// '+v;
		console.log('Conflict: I'+u+' reads "'+e+'" then "'+gotoTable[u][e]+'"');
	}else gotoTable[u][e]=v;
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
	}

	

	for (let I of C) {
		//I is of string type
		let u = stateID.get(I);
		II = I.split('\n');
		for (let X of grammerSymbol) {
			let J = GOTO(I, X);
			if (J != '') {
				//shift
				let v = stateID.get(J);
				writeGotoTable(u,X,'shift',v);
			}
			if (isTerminal(X)) {
				//maybe reduce
				for (let s of II) {
					let it = new Item();
					it.fromStr(s);
					if (it.tail == X && it.getNext() == '$') {
						writeGotoTable(u,X,'reduce',it.p);
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
				writeGotoTable(u,'$','reduce',it.p);
				if (it.p.lhs == getWordEncode(S_))
					writeGotoTable(u,'$','accept');
				break;
			}
		}
	}

	//draw states
	let dom_state = document.getElementById("state");
	let buff = '';
	for (let state_id of stateID.entries()) {
		let id = state_id[1];
		let state = reformState(state_id[0]);
		buff += '<div id=\''+'I'+id+'\'>';
		buff += 'I' + id + '</br>' + state.replace(/\n/g, '</br>');
		buff+='</br><div class="trans">';
		buff+=genTrans(gotoTable[id]);
		buff += '</div></div>';
	}
	buff += '';
	dom_state.innerHTML = buff;

	let tip=document.getElementById('tip');


	function genTrans(list){
		let ans='';
		for(let s in list){
			let e=list[s].replace('////','<note>/</note>');
			e=e.replace(/(accept|reduce|shift)/g,'<keyword>$1</keyword>');
			ans+='<stress>'+s+'</stress>'+'<note> --- </note>'+e+'</br>';
		}
		return ans;
	}
	window.addEventListener('mousemove',e=>{
		return;
		let div=e.target;
		let x=e.clientX + document.body.scrollLeft - document.body.clientLeft;
		let y=e.clientY + document.body.scrollTop - document.body.clientTop;

		tip.style.left=x+5+'px';
		tip.style.top=y+50+'px';
		let id=parseInt(div.id.replace('I',''));
		if(div.id.indexOf('I')==-1)tip.style.display='none';
		else tip.style.display='';
		tip.innerHTML=div.id+'</br>'+genTrans(gotoTable[id]);
	})

	console.log('gotoTable:');
	console.log(gotoTable);
}

/**
 * Set up a grammer for which you should decide <T,N,S,P> which means
 * <Terminals,Non-terminals,Start-symbol,Productions>.
 */
function setupGrammer(){
	setSymbol(
		'id number + - * / , ; classtype = relop if else for while { } ( ) [ ]',
		'obj fcall paramlist expr decl assignmt simplestmt stmtblock ctrlstmt cond ifstmt forstmt whilestmt',
		'stmtblock'
	);
	addProduction(1,'obj','id');
	addProduction(2,'obj','number');
	addProduction(3,'obj','fcall');
	addProduction(4,'fcall','id ( )');
	addProduction(5,'fcall','id ( paramlist )');
	addProduction(6,'paramlist','paramlist , obj');
	addProduction(7,'paramlist','obj');
	addProduction(8,'expr','expr + expr');
	addProduction(9,'expr','expr - expr');
	addProduction(10,'expr','expr * expr');
	addProduction(11,'expr','expr / expr');
	addProduction(12,'expr','( expr )');
	addProduction(13,'expr','obj');
	addProduction(14,'decl','classtype id');
	addProduction(15,'decl','classtype id = expr');
	addProduction(16,'decl','classtype id [ number ]');
	addProduction(17,'assignmt','id = expr');
	addProduction(18,'simplestmt','decl assignmt expr');
	addProduction(19,'stmtblock','stmtblock simplestmt ;');
	addProduction(20,'stmtblock','simplestmt ;');
	addProduction(21,'ctrlstmt','ifstmt');
	addProduction(22,'ctrlstmt','forstmt');
	addProduction(23,'ctrlstmt','whilestmt');
	addProduction(24,'cond','expr');
	addProduction(25,'cond','expr relop expr');
	addProduction(26,'ifstmt','if ( cond ) { stmtblock }');
	addProduction(27,'ifstmt','if ( cond ) { stmtblock } else { stmtblock }');
	addProduction(28,'forstmt','for ( simplestmt ; simplestmt ; simplestmt ) { stmtblock }')
	addProduction(29,'whilestmt','while ( cond ) { stmtblock }');

}