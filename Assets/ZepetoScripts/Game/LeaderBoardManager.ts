import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GetRangeRankResponse, LeaderboardAPI, ResetRule } from "ZEPETO.Script.Leaderboard";
import { GameObject, Transform } from "UnityEngine";
import ITM_LeaderBoard from './ITM_LeaderBoard'
export default class LeaderboardManager extends ZepetoScriptBehaviour {

    public leaderboardId: string = "a3e9b5ca-4a91-4615-9749-aa54d12ec9bf"
    public resetRule: ResetRule;
    private startRank: number = 1;
    private endRank: number = 10000; // Ranking information can be processed up to 10,000 cases at a time
    private myBestScore: number;

    @SerializeField() private myScoreGroup: GameObject;
    @SerializeField() private contentsParent: GameObject;
    @SerializeField() private ITM_Prefab: GameObject;

    Awake(){
        this.LoadLeaderboard();
        this.UnLoadLeaderboard();
        this.gameObject.SetActive(false);
    }

    OnEnable(){
        this.LoadLeaderboard();
    }

    OnDisable(){
        this.UnLoadLeaderboard();
    }

    public SendScore(score: number){
        this.myBestScore = (score < this.myBestScore || this.myBestScore == 0)? score : this.myBestScore;
        LeaderboardAPI.SetScore(this.leaderboardId, score,
            (result)=>{console.log(`result.isSuccess: ${result.isSuccess}`);},
            (error)=>{console.error(error);});

        return this.myBestScore;
    }

    LoadLeaderboard(){
        LeaderboardAPI.GetRangeRank(this.leaderboardId, this.startRank, this.endRank, this.resetRule ,false ,
            (result)=>{this.OnResult(result);},
            (error)=>{console.error(error);}
        );
    }

    OnResult(result: GetRangeRankResponse) {
        if (result.rankInfo.myRank) {
            // Set Group - My Score
            var myRank = result.rankInfo.myRank;
            const _ITM : ITM_LeaderBoard = this.myScoreGroup.GetComponent<ITM_LeaderBoard>();
            this.myBestScore = myRank.score;
            _ITM.SetGroup(myRank.member, myRank.name, myRank.rank, myRank.score);
        }

        if (result.rankInfo.rankList) {
            var end = (result.rankInfo.rankList.length < this.endRank)? result.rankInfo.rankList.length : this.endRank;
            for (let i = 0; i < end; ++i) {
                var rank = result.rankInfo.rankList[i];
                // Set Groups - All Rankings
                var newGroup : GameObject = GameObject.Instantiate(this.ITM_Prefab, this.contentsParent.transform) as GameObject;
                const _ITM : ITM_LeaderBoard = newGroup.GetComponent<ITM_LeaderBoard>();
                _ITM.SetGroup(rank.member, rank.name, rank.rank, rank.score);
            }
        }

    }

    UnLoadLeaderboard(){
        this.contentsParent.GetComponentsInChildren<ITM_LeaderBoard>().forEach((child)=>{
                GameObject.Destroy(child.gameObject);
            }
        )
    }

}