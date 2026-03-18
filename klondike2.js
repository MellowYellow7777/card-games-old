class Node {
    constructor(parent=null,child=null) {
        this.parent = parent;
        this.child = child;
    }
    setParent(parent) {
        if (this.parent) this.parent.child = null;
        this.parent = parent;
        parent.child = this;
    }
    setChild(child) {
        if (this.child) this.child.parent = null;
        this.child = child;
        child.parent = this;
    }
    allChildren(includeSelf=true) {
        var res = [];
        if (includeSelf) res.push(this);
        var node = this;
        while(node.child) {
            node = node.child;
            res.push(node);
        }
        return res;
    }
    push(child) {
        this.bottom.setChild(child);
    }
    get top() {
        return this.parent ? this.parent.top : this;
    }
    get bottom() {
        return this.child ? this.child.bottom : this;
    }
}

class Slot extends Node {
    static types = ['deck','column','foundation'];
    img = document.createElement('img');
    constructor(x,y,type) {
        if (!Slot.types.includes(type)) throw Error(type + ' is not a slot type.');
        super();
        this.type = type;
        var img = this.img;
        document.body.append(img);
        img.self = this;
        img.setAttribute('draggable','false');
        img.style.position = 'absolute';
        this.x = x;
        this.y = y;
        img.src = Card.getSrc('blank');
    }
    get slot() {return this.child ? this.bottom.slot : this}
    get parent() {return null}
    set parent(_) {}
    get x() {return this.img.offsetLeft}
    get y() {return this.img.offsetTop}
    set x(x) {this.img.style.left = x}
    set y(y) {this.img.style.top = y}
}

class Card extends Node {
    static all = []
    static updateZIndex() {
        this.all.forEach((card,index) => {
            card.img.style.zIndex = index;
        })
    }
    static buildDeck() {
        return this.suits.map(suit =>
            this.values.map(value =>
                new Card(value,suit)
            )).flat();
    }
    static values = [
        'A','2','3','4','5',
        '6','7','8','9','10',
                'J','Q','K']
    static suits = ['spades','clubs','hearts','diamonds'];
    static getSrc(value,suit) {
        return value == 'blank' ? 'svgs/blank.svg'
            :  value == 'back' ? 'svgs/back(black).svg'
            : `svgs/${suit}/${value}.svg`;
    }
    getSrc() {return Card.getSrc(this.value,this.suit);}
    img = document.createElement('img');
    constructor(value,suit) {
        if ([1,11,12,13].includes(+value)) value = ({1:'A',11:'J',12:'Q',13:'K'})[+value];
        if (!Card.values.includes(value)) throw Error(value + ' is not a card value.');
        if (!Card.suits.includes(suit)) throw Error(suit + ' is not a suit.');
        super();
        this.value = value;
        this.suit = suit;
        var img = this.img;
        img.self = this;
        img.setAttribute('draggable','false');
        img.style.position = 'absolute';
        img.src = Card.getSrc('back');
        this.isFaceUp = false;
        this.goto();
        img.onpointerclick = function(event) {
            empty
        }
        img.onpointerdown = function(event) {
            var self = this.self,
                home = {x: self.x, y: self.y};
            if (slots.deck.includes(self.top)) return;
            if (!self.isFaceUp) return;
            self.moveToTop();
            this.setPointerCapture(event.pointerId);
            this.onpointermove = function(event) {
                self.x += event.movementX;
                self.y += event.movementY;
            }
            this.onpointerup = function(event) {
                this.releasePointerCapture(event.pointerId);
                this.onpointermove = null;
                this.onpointerup = null;
                self.drop(home);
            }
        }
        
        document.body.append(img);
        Card.all.push(this);
    }
    moveToTop() {
        if (Card.all.includes(this)) {
            Card.all.splice(Card.all.indexOf(this),1);
            Card.all.push(this);
        }
        if (this.child) {
            this.child.moveToTop();
        } else {
            Card.updateZIndex();
        }
    }
    turnFaceUp() {
        this.img.src = this.getSrc();
        this.isFaceUp = true;
    }
    turnFaceDown() {
        this.img.src = Card.getSrc('back');
        this.isFaceUp = false;
    }
    flipOver() {
        if (this.isFaceUp) {
            this.turnFaceDown();
        } else {
            this.turnFaceUp();
        }
    }
    drop(home) {
        var goHome = () => {
            this.goto(home);
        }
        var slot = [
            ...slots.columns,
            ...slots.foundations,
        ].find(slot => slot.bottom !== this && dist(this,slot.bottom) <= 30);
        if (!slot) return goHome();
        var target = slot.bottom,
            ctype = slot.type == 'column',
            ftype = slot.type == 'foundation',
            empty = slot === target,
            plus1 = target?.nValue == this.nValue + 1,
            minus = target?.nValue == this.nValue - 1,
            eqcol = target?.color == this.color,
            thisK = this.value == 'K',
            thisA = this.value == 'A',
            nokid = this.child == null;

        if (
            (ctype && empty && thisK)
         || (ftype && empty && thisA && nokid)
         || (ctype && plus1 && !eqcol)
         || (ftype && minus && eqcol && nokid)
        ) {
            this.goto(target.slot);
            this.setParent(target);
        } else goHome();
    }

    get slot() {
        if (slots.columns.includes(this.top)) return {x:this.x,y:this.y+20};
        return this;
    }
    get nValue() {
        return Card.values.indexOf(this.value) + 1;
    }
    get color() {
        if (['spades','clubs'].includes(this.suit)) return 'black';
        if (['hearts','diamonds'].includes(this.suit)) return 'red';
    }
    get x() {return this.img.offsetLeft}
    get y() {return this.img.offsetTop}
    set x(x) {
        this.img.style.left = x;
        if (this.child) this.child.goto(this.slot);
    }
    set y(y) {this.img.style.top = y}
    goto(x,y) {
        if (arguments.length == 1) {
            this.goto(x.x,x.y);
        } else {
            this.x = x ?? 0;
            this.y = y ?? 0;
        }
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function dist(x1,y1,x2,y2) {
    if (arguments.length == 2) return dist(x1.x,x1.y,y1.x,y1.y);
    var [dx,dy] = [x2-x1,y2-y1];
    return Math.sqrt(dx*dx+dy*dy);
}

var slots, deck;

window.onload = function() {
    slots = {
        deck: {
            undrawn: new Slot(100,75,'deck'), 
            drawn: new Slot(200,75,'deck'),
            includes(item) {
                return item === this.undrawn
                    || item === this.drawn;
            }
        },
        columns: [
            new Slot(100,200,'column'),
            new Slot(200,200,'column'),
            new Slot(300,200,'column'),
            new Slot(400,200,'column'),
            new Slot(500,200,'column'),
            new Slot(600,200,'column'),
            new Slot(700,200,'column'),
        ],
        foundations: [
            new Slot(400,75,'foundation'),
            new Slot(500,75,'foundation'),
            new Slot(600,75,'foundation'),
            new Slot(700,75,'foundation'),
        ],
        column(n) {
            return this.columns[n-1];
        },
        foundation(n) {
            return this.foundations[n-1];
        },
    };

    deck = Card.buildDeck();
    shuffle(deck);
    var card;
    for (j = 1; j <= 7; j++) {
    for (i = j; i <= 7; i++) {
        card = deck.pop();
        card.goto(slots.column(i).bottom.slot);
        slots.column(i).push(card);
        if (i == j) card.turnFaceUp();
        card.moveToTop();
    }}
    deck.forEach(card => {
        slots.deck.undrawn.push(card);
        card.goto(slots.deck.undrawn);
    })
    slots.deck.undrawn.child.moveToTop();


}