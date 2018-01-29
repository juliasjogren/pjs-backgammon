let player1 = new Player('1')
let player2 = new Player('2')

let game = new Game()

game.findReachable(3)

function Player (name) {
  this.name = name
  this.row = []
  this.pieces = []

  for (let i = 0; i < 12; ++i) {
    this.row[i] = new Cell(i, this)
  }
}

function Cell (cellIndex, player) {
  this.cellIndex = cellIndex
  this.player = player
  this.pieces = []
  this.reachable = false

  this.addPiece = function (piece) {
    this.pieces.push(piece)
  }

  this.removePiece = function () {
    return this.pieces.pop()
  }
}

function Piece (player) {
  this.player = player

  player.pieces.push(this)
}

function movePiece (cellFrom) {
  let piece = cellFrom.removePiece()

  let steps = 3

  let cellToIndex = cellFrom.cellIndex + steps
  let cellTo = cellFrom.player.row[cellToIndex]

  if (cellFrom.player.name === piece.player.name) {
    if (cellFrom.cellIndex + steps > 11) {
      console.log('Win!')
    }
    steps = -steps
    cellToIndex = cellFrom.cellIndex + steps
    cellTo = cellFrom.player.row[cellToIndex]
  } else {
    if (cellFrom.cellIndex + steps > 11) {
      let stepsLeft = (cellFrom.cellIndex + steps) - 11
      cellToIndex = 12 - stepsLeft
      cellTo = piece.player.row[cellToIndex]
    }
  }

  cellTo.addPiece(piece)
}

function Game () {
  setStartPositions(player1, player2)
  setStartPositions(player2, player1)

  console.log('player1', player1)
  console.log('player2', player2)

  this.findReachable = function (steps) {
    for (let cell of player1.row) {
      if (cell.pieces.length) {
        let nextCellIndex = cell.cellIndex + steps
        let nextCell = player1.row[nextCellIndex]

        if (nextCell) {
          nextCell.reachable = true
        }
      }
    }
  }
}

function setStartPositions (p1, p2) {
  p1.row[4].addPiece(new Piece(p1))
  p1.row[4].addPiece(new Piece(p1))
  p1.row[4].addPiece(new Piece(p1))
  p1.row[6].addPiece(new Piece(p1))
  p1.row[6].addPiece(new Piece(p1))
  p1.row[6].addPiece(new Piece(p1))
  p1.row[6].addPiece(new Piece(p1))
  p1.row[6].addPiece(new Piece(p1))
  p2.row[11].addPiece(new Piece(p1))
  p2.row[11].addPiece(new Piece(p1))
  p2.row[0].addPiece(new Piece(p1))
  p2.row[0].addPiece(new Piece(p1))
  p2.row[0].addPiece(new Piece(p1))
  p2.row[0].addPiece(new Piece(p1))
  p2.row[0].addPiece(new Piece(p1))
}

new Vue({
  el: '#game',
  data () {
    return {
      rows: [player1.row, player2.row],
      player1,
      player2
    }
  },
  methods: {
    movePiece: movePiece
  }
})
