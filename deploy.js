const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Connexion au serveur 157.180.127.70...');
    await ssh.connect({
      host: '157.180.127.70',
      username: 'root',
      password: 'AkueMax@2022'
    });
    console.log('Connecté avec succès !');

    const commands = [
      'cd /opt && if [ -d "INFLUENCER" ]; then cd INFLUENCER && git pull; else git clone https://github.com/selogersn-alt/INFLUENCER.git && cd INFLUENCER; fi',
      'cd /opt/INFLUENCER && mkdir -p backend && echo "GEMINI_API_KEY=AIzaSyDKDR6fbvkX9J3m4U9ur9R7t5sXG2H2nTA" > backend/.env',
      'cd /opt/INFLUENCER && docker compose up -d --build'
    ];

    for (const cmd of commands) {
      console.log(`Exécution de la commande : ${cmd}`);
      const result = await ssh.execCommand(cmd);
      
      if (result.stdout) console.log('Sortie: \n' + result.stdout);
      if (result.stderr && !result.stderr.includes('Cloning') && !result.stderr.includes('Pulling')) {
        console.log('Info/Erreur: \n' + result.stderr);
      }
    }
    
    console.log('Déploiement terminé avec succès !');
    ssh.dispose();
  } catch (error) {
    console.error('Erreur lors du déploiement:', error);
    process.exit(1);
  }
}

deploy();
