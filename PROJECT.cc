#include <iostream>
using namespace std;

const int SIZE = 3;
char board[SIZE][SIZE] = { {'1', '2', '3'}, {'4', '5', '6'}, {'7', '8', '9'} };

void displayBoard() {
    cout << "\n";
    for (int i = 0; i < SIZE; ++i) {
        for (int j = 0; j < SIZE; ++j) {
            cout << " " << board[i][j];
            if (j < SIZE - 1) cout << " |";
        }
        cout << "\n";
        if (i < SIZE - 1) cout << "---|---|---\n";
    }
    cout << "\n";
}

bool isWinner(char player) {
    // Check rows and columns
    for (int i = 0; i < SIZE; ++i) {
        if (board[i][0] == player && board[i][1] == player && board[i][2] == player)
            return true;
        if (board[0][i] == player && board[1][i] == player && board[2][i] == player)
            return true;
    }
    // Check diagonals
    if (board[0][0] == player && board[1][1] == player && board[2][2] == player)
        return true;
    if (board[0][2] == player && board[1][1] == player && board[2][0] == player)
        return true;
    
    return false;
}

bool isDraw() {
    for (int i = 0; i < SIZE; ++i) {
        for (int j = 0; j < SIZE; ++j) {
            if (board[i][j] != 'X' && board[i][j] != 'O') {
                return false;
            }
        }
    }
    return true;
}

void makeMove(char player) {
    int move;
    while (true) {
        cout << "Player " << player << ", enter your move (1-9): ";
        cin >> move;
        move--;
        int row = move / SIZE;
        int col = move % SIZE;
        
        if (move >= 0 && move < SIZE * SIZE && board[row][col] != 'X' && board[row][col] != 'O') {
            board[row][col] = player;
            break;
        } else {
            cout << "Invalid move. Try again.\n";
        }
    }
}

int main() {
    char currentPlayer = 'X';
    while (true) {
        displayBoard();
        makeMove(currentPlayer);
        
        if (isWinner(currentPlayer)) {
            displayBoard();
            cout << "Player " << currentPlayer << " wins!\n";
            break;
        }
        
        if (isDraw()) {
            displayBoard();
            cout << "It's a draw!\n";
            break;
        }
        
        currentPlayer = (currentPlayer == 'X') ? 'O' : 'X';
    }
    
    return 0;
}
