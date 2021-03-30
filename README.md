This extension helps you move your cursor faster.



# Features
## GOGO: Goto Line
```
cmd: go-go-my-cursor.gotoline  
recommended shortcut: Ctrl+G

Vscode's origin goto line feature will move the page while you are still typing the line number.    
For example, if you want to goto 77th line,
Vscode jumps to 7th line after you type 7 and jump to 77th line after you type another 7.    
It's so annoying, so I made this extension that you can goto line after pressing the enter.    
You can bind "go-go-my-cursor.gotoline" to your Ctrl+G shortcut to replace the original one.  
```


## GOGO: Goto Left
```
cmd: go-go-my-cursor.gotoleft  
recommended shortcut: Alt+[
    
Search from current cursor position - 1 to the begining of the file,  
and go to the first matched word.  

For example,
qbaabaa|baa  
       ^  
  your cursor is here  
  
Now if you use this cmd to search for word "qbaa", your cursor will move to here  
|qbaabaabaa  
^

If you search for "baa", your cursor will move to here  
qbaa|baabaa  
    ^
```

## GOGO: Goto Right
```
cmd: go-go-my-cursor.gotoright  

recommended shortcut: Alt+]

Search from current cursor position + 1 to the end of the file,  
and go to the first matched word.  

For example,
qbaa|baabaa  
    ^     
  your cursor is here  
  
Now if you use this cmd to search for word "baa", your cursor will move to here  
qbaabaa|baa  
       ^
because this cmd will search the word from (cursor pos + 1);
```