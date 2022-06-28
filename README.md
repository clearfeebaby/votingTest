# Tests unitaires du contract "Voting"

Description des tests concernant le contract "Voting".

---
## 1) Test général sur le déploiment du contrat
### 2 Tests :

- Vérifie la bonne création d'une nouvelle instance
- Vérifie la bonne assignation du propriétaire du contrat

---
## 2) Test global de la fonction addVoter
### 7 Tests :

- Vérifie que seul le propriétaire puisse ajouter un nouveau voteur
- Vérifie que le nouveau voteur n'est pas déjà enregistré
- Vérifie que le workflow ait bien le statut `RegisteringVoters`
- Vérifie que le nouveau voteur soit correctement enregistré
- Vérifie que le nouveau voteur n'ait pas encore voté
- Vérifie que le nouveau voteur n'ait pas de proposition assigné
- Vérifie que l'évènement `VoterRegistered` remonte correctement

---
## 3) Test global de la fonction addProposal
### 6 Tests :

- Vérifie que seul les voteurs aient le droit de vote
- Vérifie que le workflow ait bien le statut `ProposalsRegistrationStarted`
- Vérifie que la proposition n'est pas vide
- Vérifie que la description de la proposition est correcte (getter)
- Vérifie que le nombre de vote pour la proposition est correcte (getter)
- Vérifie que l'évènement `ProposalRegistered` remonte correctement

---
## 4) Test global de la fonction setVote
### 7 Tests :

- Vérifie que seul les voteurs puisse voter
- Vérifie que le nouveau voteur n'ai pas déjà voté
- Vérifie que le workflow ait bien le statut `VotingSessionStarted`
- Vérifie que la proposition a voter existe
- Vérifie que le vote soit correctement enregistré
- Vérifie que la proposition ait le bon ID
- Vérifie que l'évènement `Voted` remonte correctement

---
