const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow; // Declara mainWindow fora da função para que seja acessível globalmente

function createWindow() {
  // Cria a janela do navegador.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400, // Largura mínima
    minHeight: 300, // Altura mínima
    webPreferences: {
      nodeIntegration: true, // Habilita Node.js no renderizador (cuidado com segurança)
      contextIsolation: false // Desabilita isolamento de contexto (cuidado com segurança, para simplificar este exemplo)
    }
  });

  // Carrega o arquivo index.html do seu aplicativo.
  mainWindow.loadFile('index.html');

  // Abre as Ferramentas de Desenvolvedor (opcional).
  // mainWindow.webContents.openDevTools();

  // Define o menu personalizado
  setupApplicationMenu();
}

function setupApplicationMenu() {
  const template = [
    // Menu padrão do Electron (File, Edit, View, Window, Help)
    {
      label: 'Arquivo',
      submenu: [
        { role: 'quit', label: 'Sair' } // Adiciona um item para sair do aplicativo
      ]
    },
    {
      label: 'Editar',
      submenu: [
        {
          label: 'Definir Mensagem do Letreiro',
          click: () => {
            // Cria uma nova janela para o input da mensagem
            const inputWindow = new BrowserWindow({
              width: 500,
              height: 250,
              parent: mainWindow, // Torna esta janela modal em relação à janela principal
              modal: true,
              show: false, // Esconde a janela até que esteja pronta para mostrar
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
              }
            });

            inputWindow.loadFile('input.html'); // Carrega o HTML da janela de input

            // Mostra a janela quando estiver pronta
            inputWindow.once('ready-to-show', () => {
              inputWindow.show();
            });

            // Escuta a mensagem enviada da janela de input
            ipcMain.once('set-marquee-message', (event, message) => {
              // Envia a mensagem para o processo de renderização da janela principal
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('update-marquee-message', message);
              }
              inputWindow.close(); // Fecha a janela de input
            });

            // Lida com o fechamento da janela de input caso o usuário feche manualmente
            inputWindow.on('closed', () => {
              // Limpa o listener para evitar vazamentos de memória ou comportamentos inesperados
              ipcMain.removeListener('set-marquee-message', (event, message) => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('update-marquee-message', message);
                }
                inputWindow.close();
              });
            });
          }
        }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forcereload', label: 'Forçar Recarregar' },
        { type: 'separator' },
        { role: 'toggledevtools', label: 'Alternar Ferramentas de Desenvolvedor' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o Letreiro Digital',
              message: 'Este é um aplicativo de letreiro digital simples construído com Electron.js.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Este método será chamado quando o Electron terminar a inicialização
// e estiver pronto para criar janelas do navegador.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // No macOS, é comum recriar uma janela no aplicativo quando
    // o ícone do dock é clicado e não há outras janelas abertas.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Sai quando todas as janelas são fechadas, exceto no macOS.
// Neste SO, é comum que os aplicativos e sua barra de menu
// permaneçam ativos até que o usuário saia explicitamente com Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
