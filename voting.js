const Voting = artifacts.require('./Voting.sol');
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Voting', accounts => {
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];
  const nonVoter1 = accounts[4];
  const proposal1 = 'proposal1';
  const proposal2 = 'proposal2';
  const proposal3 = 'proposal3';

  let votingInstance;

  /*= ========= General Tests ========== */

  describe('Test general contract events', () => {
    beforeEach(async () => {
      votingInstance = await Voting.new({ from: owner });
    });

    it('Create a new contract instance', async () => {
      expect(votingInstance.address).to.be.not.null;
    });

    it('Define correct owner address', async () => {
      expect(await votingInstance.owner()).to.equal(owner);
    });
  });

  /*= ========= addVoters ========== */

  describe('Test addVoters', function() {
    beforeEach(async function() {
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(voter1, { from: owner });
    });

    it('Revert because not owner', async () => {
      await expectRevert(
        votingInstance.addVoter(voter2, { from: voter1 }),
        'Ownable: caller is not the owner'
      );
    });

    it('Revert because already registered', async () => {
      await expectRevert(
        votingInstance.addVoter(voter1, { from: owner }),
        'Already registered'
      );
    });

    it('Revert because it is not registration time', async () => {
      await votingInstance.startProposalsRegistering({ from: owner });
      await expectRevert(
        votingInstance.addVoter(voter2, { from: owner }),
        'Voters registration is not open yet'
      );
    });

    it('Register a new voter', async () => {
      await votingInstance.addVoter(voter2, { from: owner });
      const newVoter = await votingInstance.getVoter(voter2, {
        from: voter1,
      });
      expect(newVoter.isRegistered).to.be.true;
    });

    it('New voter has not vote yet', async () => {
      await votingInstance.addVoter(voter2, { from: owner });
      const newVoter = await votingInstance.getVoter(voter2, {
        from: voter1,
      });
      expect(newVoter.hasVoted).to.be.false;
    });

    it('New voter has not vote for a singular proposition yet', async () => {
      await votingInstance.addVoter(voter2, { from: owner });
      const newVoter = await votingInstance.getVoter(voter2, {
        from: voter1,
      });
      expect(new BN(newVoter.votedProposalId)).to.be.bignumber.equal(new BN(0));
    });

    it('Emit an event after registration', async () => {
      const newVoter = await votingInstance.addVoter(voter2, {
        from: owner,
      });
      expectEvent(newVoter, 'VoterRegistered', { voterAddress: voter2 });
    });
  });

  /*= ========= addProposal ========== */

  describe('Test addProposal', () => {
    beforeEach(async () => {
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(voter1, { from: owner });
      await votingInstance.startProposalsRegistering({ from: owner });
    });

    it('Revert because not a voter', async () => {
      await expectRevert(
        votingInstance.addProposal(proposal1, { from: voter2 }),
        "You're not a voter"
      );
    });

    it('Revert because it is not proposal time', async () => {
      await votingInstance.endProposalsRegistering({ from: owner });
      await expectRevert(
        votingInstance.addProposal(proposal1, { from: voter1 }),
        'Proposals are not allowed yet'
      );
    });

    it('Revert because empty proposal', async () => {
      await expectRevert(
        votingInstance.addProposal('', { from: voter1 }),
        'Vous ne pouvez pas ne rien proposer'
      );
    });

    it('Proposal correct description', async () => {
      await votingInstance.addProposal(proposal1, {
        from: voter1,
      });
      await votingInstance.addProposal(proposal2, {
        from: voter1,
      });
      const proposal = await votingInstance.getOneProposal(0, {
        from: voter1,
      });
      const proposalBis = await votingInstance.getOneProposal(1, {
        from: voter1,
      });
      expect(proposal.description).to.be.equal(proposal1);
      expect(proposalBis.description).to.be.equal(proposal2);
    });

    it('Proposal correct count', async () => {
      await votingInstance.addProposal(proposal1, {
        from: voter1,
      });
      const proposal = await votingInstance.getOneProposal(0, {
        from: voter1,
      });
      expect(new BN(proposal.voteCount)).to.be.bignumber.equal(new BN(0));
    });

    it('Should emit an event after proposal', async () => {
      const proposal = await votingInstance.addProposal(proposal1, {
        from: voter1,
      });
      expectEvent(proposal, 'ProposalRegistered', {
        proposalId: new BN(0),
      });
    });
  });

  /*= ========= setVote ========== */

  describe('test setVote', () => {
    beforeEach(async () => {
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(voter1, { from: owner });
      await votingInstance.startProposalsRegistering({ from: owner });
      await votingInstance.addProposal(proposal1, {
        from: voter1,
      });
      await votingInstance.addProposal(proposal2, {
        from: voter1,
      });
      await votingInstance.endProposalsRegistering({ from: owner });
      await votingInstance.startVotingSession({ from: owner });
    });

    it('Revert because not voter', async () => {
      await expectRevert(
        votingInstance.setVote(0, { from: nonVoter1 }),
        "You're not a voter"
      );
    });

    it('Revert because already voted', async () => {
      await votingInstance.setVote(0, { from: voter1 });
      await expectRevert(
        votingInstance.setVote(0, { from: voter1 }),
        'You have already voted'
      );
    });

    it("Revert because voting sessions hasn't started", async () => {
      await votingInstance.endVotingSession({ from: owner });
      await expectRevert(
        votingInstance.setVote(0, { from: voter1 }),
        'Voting session havent started yet'
      );
    });

    it('Revert because proposal not found', async () => {
      await expectRevert(
        votingInstance.setVote(2, { from: voter1 }),
        'Proposal not found'
      );
    });

    it('Voter should have vote', async () => {
      await votingInstance.setVote(1, { from: voter1 });
      const vote = await votingInstance.getVoter(voter1, {
        from: voter1,
      });
      expect(vote.hasVoted).to.be.true;
    });

    it('Proposal ID should match', async () => {
      await votingInstance.setVote(1, { from: voter1 });
      const vote = await votingInstance.getVoter(voter1, {
        from: voter1,
      });
      expect(new BN(vote.votedProposalId)).to.be.bignumber.equal(new BN(1));
    });

    it('Emit an event after vote', async () => {
      const addVote = await votingInstance.setVote(0, { from: voter1 });
      expectEvent(addVote, 'Voted', {
        voter: voter1,
        proposalId: new BN(0),
      });
    });
  });

  /*= ========= WorkflowStatus changes ========== */

  describe('Test workflowstatus changes', function() {
    before(async function() {
      votingInstance = await Voting.new({ from: owner });
    });

    it('Change from RegisteringVoters to ProposalsRegistrationStarted + event', async () => {
      const event = await votingInstance.startProposalsRegistering();
      const status = await votingInstance.workflowStatus();
      expect(new BN(status)).to.be.bignumber.equal(
        new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted)
      );
      expectEvent(event, 'WorkflowStatusChange', {
        previousStatus: '0',
        newStatus: '1',
      });
    });

    it('Change from ProposalsRegistrationStarted to ProposalsRegistrationEnded + event', async () => {
      const event = await votingInstance.endProposalsRegistering();
      const status = await votingInstance.workflowStatus();
      expect(new BN(status)).to.be.bignumber.equal(
        new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded)
      );
      expectEvent(event, 'WorkflowStatusChange', {
        previousStatus: '1',
        newStatus: '2',
      });
    });

    it('Change from ProposalsRegistrationEnded to VotingSessionStarted + event', async () => {
      const event = await votingInstance.startVotingSession();
      const status = await votingInstance.workflowStatus();
      expect(new BN(status)).to.be.bignumber.equal(
        new BN(Voting.WorkflowStatus.VotingSessionStarted)
      );
      expectEvent(event, 'WorkflowStatusChange', {
        previousStatus: '2',
        newStatus: '3',
      });
    });

    it('Change from VotingSessionStarted to VotingSessionEnded + event', async () => {
      const event = await votingInstance.endVotingSession();
      const status = await votingInstance.workflowStatus();
      expect(new BN(status)).to.be.bignumber.equal(
        new BN(Voting.WorkflowStatus.VotingSessionEnded)
      );
      expectEvent(event, 'WorkflowStatusChange', {
        previousStatus: '3',
        newStatus: '4',
      });
    });

    it('Change from VotingSessionEnded to VotesTallied + event', async () => {
      const event = await votingInstance.tallyVotes();
      const status = await votingInstance.workflowStatus();
      expect(new BN(status)).to.be.bignumber.equal(
        new BN(Voting.WorkflowStatus.VotesTallied)
      );
      expectEvent(event, 'WorkflowStatusChange', {
        previousStatus: '4',
        newStatus: '5',
      });
    });
  });

  /*= ========= tallyVotes ========== */

  describe('test tallyVotes', () => {
    beforeEach(async () => {
      votingInstance = await Voting.new({ from: owner });
      await votingInstance.addVoter(voter1, { from: owner });
      await votingInstance.addVoter(voter2, { from: owner });
      await votingInstance.addVoter(voter3, { from: owner });

      await votingInstance.startProposalsRegistering({ from: owner });

      await votingInstance.addProposal(proposal1, {
        from: voter1,
      });
      await votingInstance.addProposal(proposal2, {
        from: voter2,
      });
      await votingInstance.addProposal(proposal3, {
        from: voter2,
      });

      await votingInstance.endProposalsRegistering({ from: owner });
      await votingInstance.startVotingSession({ from: owner });

      await votingInstance.setVote(2, { from: voter1 });
      await votingInstance.setVote(2, { from: voter2 });
      await votingInstance.setVote(1, { from: voter3 });
    });

    it('Revert because not owner', async () => {
      await expectRevert(
        votingInstance.tallyVotes({ from: voter1 }),
        'Ownable: caller is not the owner'
      );
    });

    it('Revert because voting session is not ending', async () => {
      await expectRevert(
        votingInstance.tallyVotes({ from: owner }),
        'Current status is not voting session ended'
      );
    });

    it('Display the winning proposal', async () => {
      await votingInstance.endVotingSession({ from: owner });
      await votingInstance.tallyVotes({ from: owner });
      const winningProposalFromVariable = await votingInstance.winningProposalID.call();
      expect(new BN(winningProposalFromVariable)).to.be.bignumber.equal(
        new BN(2)
      );

      const winningProposalFromGetter = await votingInstance.getOneProposal(2, {
        from: voter1,
      });
      expect(winningProposalFromGetter.description).to.be.equal(proposal3);
      expect(new BN(winningProposalFromGetter.voteCount)).to.be.bignumber.equal(
        new BN(2)
      );
    });
  });
});
