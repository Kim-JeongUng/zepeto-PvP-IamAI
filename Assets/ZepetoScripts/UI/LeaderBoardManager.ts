import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GetRangeRankResponse, LeaderboardAPI, ResetRule } from "ZEPETO.Script.Leaderboard";
import { GameObject, Transform } from "UnityEngine";
import ITM_LeaderBoard from './ITM_LeaderBoard'
import {Button} from "UnityEngine.UI";
export default class LeaderboardManager extends ZepetoScriptBehaviour {

    public leaderboardId: string = "1ee41bb4-932f-4f6b-a9fb-653f9e556e01"
    public resetRule: ResetRule;
    private startRank: number = 1;
    private endRank: number = 10000; // Ranking information can be processed up to 10,000 cases at a time
    private myBestScore: number;

    @SerializeField() private myScoreGroup: GameObject;
    @SerializeField() private contentsParent: GameObject;
    @SerializeField() private ITM_Prefab: GameObject;
    @SerializeField() private m_LeaderboardBtn: Button;


    public static instance: LeaderboardManager;
    /* Singleton */
    private Awake() {
        if (LeaderboardManager.instance == null) {
            LeaderboardManager.instance = this;
        } else {
            return;
        }
    }
    private Start(){
        this.m_LeaderboardBtn.onClick.AddListener(()=>{
            this.UnLoadLeaderboard();
            this.SendScore(0);
            this.LoadLeaderboard();
        })
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