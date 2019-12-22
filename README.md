# LR1-Parsing-Table

通过产生式生成LR(1)文法的所有状态和转移关系,以及对token序列的自动解析.

Generate LR1 parsing table from productions and parse a token sequence with it.

This was made for my compiler course and it is still being developed.

Customize the grammer in 'setupGrammer' function in 'LR1.js' where you can modify T, V, S, P 
which stand for terminals, non-terminals, start-symbol and productions.