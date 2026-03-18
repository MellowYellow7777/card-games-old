
class Card {
    static all = [];
    static deck = [];
    static drawn = [];
    static buildDeck() {
        this.deck = 
            this.suits.map(suit =>
            this.values.map(value => 
                new Card(value,suit)
            )).flat();
    }
    static dealNewGame() {
        this.buildDeck();
        this.shuffle();

        var i = 1;
        while (this.deck.length) {
            var card = this.deck.pop();
            card.slotOffset = {x:0,y:20};
            card.placeOn(slots.column(i));card.moveToTop();
            card.turnFaceUp();
            i++;
            if (i > 8) i = 1;
        }
                
    }    static shuffle() {
        (deck => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }})(this.deck)
    }

    static draw3() {
        
        var loc = slots.deck_right
        var card; 
        for (let xo = 0; xo <=40; xo+=20) {
        card = this.deck.pop();
        card.slotOffset = {x:20,y:0};
        this.drawn.push(card);
        card.placeOn(slot0);
        card.goto(loc.x+xo,loc.y);
        card.turnFaceUp();
        card.moveToTop();
        }
        
    }    
    static flipDeck() {
        
        var loc = slots.deck_left,
            card; 
        while (this.drawn.length) {
            card = this.drawn.pop();
            card.slotOffset = {x:0,y:0};
            this.deck.push(card);
            card.placeOn(slot00);
            card.turnFaceDown();
            card.moveToTop();
        }
        
    }
    static updZIndex() {
        this.all.forEach((card,i) => card.element.style.zIndex = i);
    }
    static suits = ['spades','hearts','diamonds','clubs']
    static values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
    static getSrc(value,suit) {
        return value == 'blank' ? 'svgs/blank.svg'
            :  value == 'back' ? 'svgs/back.svg'
            : `svgs/${suit}/${value}.svg`;
    }
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
            inaces = slots.aces.includes(card?.top()),
            ataces = slots.aces.includes(card),
            atcell = slots.cells.includes(card),
            faceup = card.isFaceUp,
            nokids = card.child === null,
            oppcol = this.color != card.color,
            eqsuit = this.suit === card.suit,
            nplus1 = card.nvalue() == this.nvalue() + 1,
            nsubt1 = this.nvalue() == card.nvalue() + 1,
            amking = this.value == 'K',
            am_ace = this.value == 'A';
            
        return (incols && nokids && faceup && oppcol && nplus1)
            || (atcols)
            || (inaces && nokids && faceup && eqsuit && nsubt1)
            || (ataces && am_ace && this.child == null)
            || (atcell && nokids && this.child == null)
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
        img.onpointerdown = function(event) {
            var self = this.self;
            //if (self.top() == slot0 && self !== self.bottom()) return; 
            var ch = this.self;
            while(ch.child) {
                if (ch.color == ch.child.color) return;
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
        if (slots.aces.includes(this.top())) return ({x:this.x, y:this.y});

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

    (slotc1 = new Card('blank',null,100,75)).draggable = false;
    (slotc2 = new Card('blank',null,190,75)).draggable = false;
    (slotc3 = new Card('blank',null,280,75)).draggable = false;
    (slotc4 = new Card('blank',null,370,75)).draggable = false;

    (slota1 = new Card('blank',null,530,75)).draggable = false;
    (slota2 = new Card('blank',null,620,75)).draggable = false;
    (slota3 = new Card('blank',null,710,75)).draggable = false;
    (slota4 = new Card('blank',null,800,75)).draggable = false;

    (slot1 = new Card('blank',null,100,200)).draggable = false;
    (slot2 = new Card('blank',null,200,200)).draggable = false;
    (slot3 = new Card('blank',null,300,200)).draggable = false;
    (slot4 = new Card('blank',null,400,200)).draggable = false;
    (slot5 = new Card('blank',null,500,200)).draggable = false;
    (slot6 = new Card('blank',null,600,200)).draggable = false;
    (slot7 = new Card('blank',null,700,200)).draggable = false;
    (slot8 = new Card('blank',null,800,200)).draggable = false;

    slots = {
        cells : [slotc1,slotc2,slotc3,slotc4],
        aces  : [slota1,slota2,slota3,slota4],
        columns : [slot1,slot2,slot3,slot4,slot5,slot6,slot7,slot8],

        cell(n) {return this.cell[n-1];},
        ace(n) {return this.aces[n-1];},
        column(n) {return this.columns[n-1];},
    }

    Card.dealNewGame();
}