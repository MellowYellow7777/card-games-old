window.onkeydown = function(event) {
    if (!['KeyR','KeyB'].includes(event.code)) return;
    if (event.code == 'KeyR') Card.backColor = 'red';
    if (event.code == 'KeyB') {
        if (Card.backColor == 'blue') {
            Card.backColor = 'black';
        } else {
            Card.backColor = 'blue';
        }
    }
    Card.all.map(card => {
        if (!card.isFaceUp) card.turnFaceDown();
    })
}
class Card {
    static all = [];
    static deck = [];
    static piles = [];
    static buildDeck() {
        this.deck = 
            [1,2,3,4,5,6,7,8].map(_ =>
            this.values.map(value => 
                new Card(value,'spades')
            )).flat();
    }
    static dealNewGame() {
        this.buildDeck();
        this.shuffle();

        var i = 1;
        while (i <= 54) {
            var card = this.deck.pop();
            card.slotOffset = {x:0,y:20};
            card.placeOn(slots.column((i++-1)%10+1));card.moveToTop();
            if (i >= 46) {
                card.turnFaceUp();
            } else {
                card.turnFaceDown();
            }
        }

        var pile;
        for (i = 1; i <=5; i++) {
        pile = [];
        this.piles.push(pile);
        for (let j = 1; j <=10; j++) {
            var card = this.deck.pop();
            card.slotOffset = j==10 ? {x:10,y:0} : {x:0,y:0};
            card.placeOn(slots.deck);
            card.moveToTop();
            card.turnFaceDown();
            pile.push(card);
        }}
                
    }
    static shuffle() {
        (deck => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }})(this.deck)
    }

    static dealRow() {
        
        var pile = this.piles.pop();
        for (let i = 1; i <= 10; i++) {
            var card = pile.pop();
            card.slotOffset = {x:0,y:20};
            card.placeOn(slots.column(i).bottom());
            card.moveToTop();
            card.turnFaceUp();
        }        
    }    
    static updZIndex() {
        this.all.forEach((card,i) => card.element.style.zIndex = i);
    }
    static suits = ['spades','hearts','diamonds','clubs']
    static values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
    static getSrc(value,suit) {
        return value == 'blank' ? 'svgs/blank.svg'
            :  value == 'back' ? 'svgs/back(' + this.backColor + ').svg'
            : `svgs/${suit}/${value}.svg`;
    }
    static backColor = 'black';
    getSrc() {return Card.getSrc(this.value,this.suit);}
    moveToTop() {
        Card.all = [...Card.all.filter(card => !this.allChildren().includes(card)), ...this.allChildren()];
        Card.updZIndex();
    }
    get color() {
        if (this.suit == 'hearts' || this.suit == 'diamonds') return 'red';
        if (this.suit == 'spades' || this.suit == 'clubs') return 'black';
    }
    nvalue() {
        return ({
            A:1,
            '2':2, 
            '3':3, 
            '4':4, 
            '5':5, 
            '6':6,
            '7':7,
            '8':8,
            '9':9,
            '10':10,
            J:11,
            Q:12,
            K:13
        })[this.value]

    }
    isValidParent(card) {
        if (!card) return false;

        var incols = slots.columns.includes(card?.top()),
            atcols= slots.columns.includes(card),
            faceup = card.isFaceUp,
            nokids = card.child === null,
            eqsuit = this.suit === card.suit,
            nplus1 = card.nvalue() == this.nvalue() + 1;
            
        return (incols && nokids && faceup && eqsuit && nplus1)
            || (atcols)
    }
    constructor(value,suit,x,y) {
        var img = this.element = document.createElement('img');
        document.body.append(this.element);
        img.src = Card.getSrc(value,suit);
        img.className = 'card';
        img.setAttribute('draggable','false');
        img.style.position = 'absolute';
        img.self = this;
        this.draggable = true;
        this.isFaceUp = true;
        this.slotOffset = (value == 'blank') ? {x:0,y:0} : {x:0, y:20};
        if (arguments.length >2) this.goto(x,y);
        img.onclick = function(event) {
            var self = this.self;
            if (Card.piles.length && Card.piles .at(-1).includes(self)) Card.dealRow();
            if (self.isFaceUp) return;
            if (!slots.columns.includes(self.top())) return;
            if (self.child) return;
            self.turnFaceUp();
        }
        img.onpointerdown = function(event) {
            var self = this.self;
            if (!self.isFaceUp) return;
            var ch = this.self;
            while(ch.child) {
                if (ch.nvalue() != ch.child.nvalue() + 1) return;
                ch = ch.child;
            }
            if (!self.draggable) return;
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
                var hoveringOver = Card.all.find(card => card !== self && card.inDropZone(self.x,self.y));
                if (!self.isValidParent(hoveringOver)) {
                    self.goto(self.parent.slot);
                    return;
                }
                if (self.parent) {
                    if (hoveringOver !== this.self.parent) {
                        self.parent.child = null;
                        self.parent = null;
                    }
                }
                if (hoveringOver) {
                    self.parent = hoveringOver;
                    if (slots.aces.includes(hoveringOver.top())) self.slotOffset = {x:0,y:0};
                    hoveringOver.child = self;
                    self.x = hoveringOver.slot.x;
                    self.y = hoveringOver.slot.y;
                }
                
            }
        }
        this.child = null;
        this.parent = null;
        this.value = value;
        this.suit = suit;
        Card.all.push(this);
    }

    get slot() {

        if (slots.columns.includes(this)) return ({x:this.x, y:this.y});
        if (slots.columns.includes(this.top())) return ({x:this.x, y:this.y + 20});

        return {x:this.x + this.slotOffset.x, y:this.y + this.slotOffset.y}
    }

    

    placeOn(card) {
        card = card.bottom();
        if (this.parent) this.parent.child = null;
        this.parent = card;
        card.child = this;
        this.goto(card.slot);
    }
    nextOpenSlot() {
        return this.bottom().slot;
    }

    turnFaceUp() {
        this.isFaceUp = true;
        this.element.src = this.getSrc();
    }
    turnFaceDown() {
        this.isFaceUp = false;
        this.element.src = Card.getSrc('back');
    }

    bottom() {
        var res = this;
        while(res.child) res = res.child;
        return res;
    }
    top() {
        var res = this;
        while(res.parent) res = res.parent;
        return res;
    }
    allChildren() {
        var arr = [this],
            res = this;
        while(res.child) arr.push(res = res.child);
        return arr;
    }
    inDropZone(x,y) {
        if (this.child) return false;
        return dist(x,y,this.slot.x,this.slot.y) <= 30;
    }
    get x() {return this.element.offsetLeft;}
    get y() {return this.element.offsetTop;}
    set x(x) {
        this.element.style.left = x;
        if(this.child) this.child.x = this.slot.x;
    }
    set y(y) {
        this.element.style.top = y;
        if(this.child) this.child.y = this.slot.y;
    }
    goto(x,y) {
        if (arguments.length == 1) [y,x] = [x.y,x.x];
        this.x = x; this.y = y;
    }
    
}



function dist(x1,y1,x2,y2) {var [dx,dy] = [x2-x1,y2-y1]; return Math.sqrt(dx*dx+dy*dy)};





window.onload = function load(event) {

    (slot00 = new Card('blank',null,100,75)).draggable = false;

    (slota = new Card('blank',null,300,75)).draggable = false;
    (slotb = new Card('blank',null,400,75)).draggable = false;
    (slotc = new Card('blank',null,500,75)).draggable = false;
    (slotd = new Card('blank',null,600,75)).draggable = false;
    (slote = new Card('blank',null,700,75)).draggable = false;
    (slotf = new Card('blank',null,800,75)).draggable = false;
    (slotg = new Card('blank',null,900,75)).draggable = false;
    (sloth = new Card('blank',null,1000,75)).draggable = false;

    (slot1 = new Card('blank',null,100,200)).draggable = false;
    (slot2 = new Card('blank',null,200,200)).draggable = false;
    (slot3 = new Card('blank',null,300,200)).draggable = false;
    (slot4 = new Card('blank',null,400,200)).draggable = false;
    (slot5 = new Card('blank',null,500,200)).draggable = false;
    (slot6 = new Card('blank',null,600,200)).draggable = false;
    (slot7 = new Card('blank',null,700,200)).draggable = false;
    (slot8 = new Card('blank',null,800,200)).draggable = false;
    (slot9 = new Card('blank',null,900,200)).draggable = false;
    (slot10 = new Card('blank',null,1000,200)).draggable = false;

    slots = {
        deck : slot00,
        aces  : [slota,slotb,slotc,slotd,slote,slotf,slotg,sloth],
        columns : [slot1,slot2,slot3,slot4,slot5,slot6,slot7,slot8,slot9,slot10],

        ace(n) {return this.aces[n-1];},
        column(n) {return this.columns[n-1];},
    }

    Card.dealNewGame();
}