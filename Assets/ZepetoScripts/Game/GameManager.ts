import { Animator,AnimationClip, GameObject, Quaternion, Random, SpriteRenderer, Texture2D, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { Button,Image } from 'UnityEngine.UI';
import { LocalPlayer, SpawnInfo, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import ZepetoGameCharacter, { MotionState } from './ZepetoGameCharacter';
import KillLogPanel from './KillLogPanel';
import ClientStarterV2 from './ClientStarterV2';

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: MotionIndex,
}
interface PlayerKillInfo {
    attackerSessionId: string,
    attackerNickname: string,
    victimSessionId: string,
    victimNickname: string,
}

interface SyncTransform {
    SessionId: string,
    PosX: number,
    PosZ: number,
    RotY: number,
}

enum MotionIndex {
    "Punch" = 0,
    "Defense",
    "Die"
}

export default class GameManager extends ZepetoScriptBehaviour {
    @SerializeField() private _punchGesture: AnimationClip;
    @SerializeField() private _defenseGesture: AnimationClip;
    @SerializeField() private _dieGesture: AnimationClip;

    public room: Room;
    private _myCharacter: ZepetoCharacter;   
    private _killLogPanel: KillLogPanel;

    private _punchCool: number = 5;
    private _punchFlag: boolean;
    private _punchBtn: Button;
    
    private _defenseCool: number = 5;
    private _defenseFlag: boolean;
    private _defenseBtn: Button;    


    private _onEndFlag: boolean;

    private MESSAGE = {
        OnPlayGesture: "OnPlayGesture",
        OnKillPlayer: "OnKillPlayer",
        OnEndGame:"OnEndGame",
        LeftPlayer:"LeftPlayer",
        GameStart:"GameStart",
        FirstSyncPlayer:"FirstSyncPlayer",
    };

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room = ClientStarterV2.instance.room;
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this.InitMessageHandler();
            this.InitBtnHandler();
        });
        this._killLogPanel = GameObject.Find("KillLogPanel").GetComponent<KillLogPanel>();
    }
    
    InitMessageHandler() {
        this.room.AddMessageHandler(this.MESSAGE.OnPlayGesture, (message: PlayerGestureInfo) => {
            this.StartCoroutine(this.GestureSync(message));
        });
        this.room.AddMessageHandler(this.MESSAGE.OnKillPlayer, (message: PlayerKillInfo) => {
            this.KillLog(message);
        });
        this.room.AddMessageHandler(this.MESSAGE.GameStart, (message) => {
            this.ResetAllVar();
        });
        this.room.AddMessageHandler(this.MESSAGE.FirstSyncPlayer, (message: SyncTransform[]) => {
            this.PlayerSync(message);
        });

        this.room.AddMessageHandler(this.MESSAGE.OnEndGame, (message) => {
            //End Game
            this._onEndFlag = true;
        });
    } 
    
    InitBtnHandler(){
        this._punchBtn = GameObject.Find("PunchBtn").GetComponent<Button>() as Button;
        this._punchBtn.onClick.AddListener(() => {
            if(this._myCharacter.GetComponent<ZepetoGameCharacter>().motionState==MotionState.Idle) {
                this.StartCoroutine(this.Punch());
            }
        });
        this._defenseBtn = GameObject.Find("DefenseBtn").GetComponent<Button>() as Button;
        this._defenseBtn.onClick.AddListener(() => {
            if(this._myCharacter.GetComponent<ZepetoGameCharacter>().motionState==MotionState.Idle)
                this.StartCoroutine(this.Defense());
        });
    }
    
    ResetAllVar(){
        this._punchFlag = false;
        this._defenseFlag = false;
        this._onEndFlag = false;
    }
    
    PlayerSync(receivePlayer : SyncTransform[]){
        for(let i=0; i<receivePlayer.length; i++) {
            const position = new Vector3(receivePlayer[i].PosX, 0, receivePlayer[i].PosZ);
            const rotation = Quaternion.Euler(new Vector3(0, receivePlayer[i].RotY, 0));
            const Player = ZepetoPlayers.instance.GetPlayer(receivePlayer[i].SessionId);
            Player.character.Teleport(position,rotation);
        }
    }
    
    * Punch() {
        if (!this._punchFlag) {
            this._punchFlag = true;
            this._punchBtn.GetComponentInChildren<Animator>().speed = 5/this._punchCool
            this._punchBtn.GetComponentInChildren<Animator>().Play("ButtonAnim");
            this.room.Send(this.MESSAGE.OnPlayGesture, MotionIndex.Punch);
            yield new WaitForSeconds(this._punchCool);
            this._punchFlag = false;
        }
    }
    
   * Defense() {
        if (!this._defenseFlag) {
            this._defenseFlag = true;
            this._defenseBtn.GetComponentInChildren<Animator>().speed = 5/this._defenseCool
            this._defenseBtn.GetComponentInChildren<Animator>().Play("ButtonAnim");
            this.room.Send(this.MESSAGE.OnPlayGesture, MotionIndex.Defense);            
            yield new WaitForSeconds(this._defenseCool);
            this._defenseFlag = false;
        }
    }
    
    Kill(attacker: Transform, victim: Transform) {
        if(this.room.SessionId == attacker.GetComponent<ZepetoGameCharacter>().sessionID) {
            const data = new RoomData();
            data.Add("attackerSessionId", attacker.GetComponent<ZepetoGameCharacter>().sessionID);
            data.Add("attackerNickname", attacker.GetComponent<ZepetoGameCharacter>().nickname);
            data.Add("victimSessionId", victim.GetComponent<ZepetoGameCharacter>().sessionID);
            data.Add("victimNickname", victim.GetComponent<ZepetoGameCharacter>().nickname);
            data.Add("victimTag", victim.tag);
            this.room.Send(this.MESSAGE.OnKillPlayer, data.GetObject());
        }
    }

    * GestureSync(playerGestureInfo: PlayerGestureInfo) {
        const zepetoCharacter = ZepetoPlayers.instance.GetPlayer(playerGestureInfo.sessionId).character;
        let motionState = zepetoCharacter.GetComponent<ZepetoGameCharacter>().motionState;
        
        if (playerGestureInfo.gestureIndex == MotionIndex.Punch) {
            zepetoCharacter.SetGesture(this._punchGesture);            
            motionState = MotionState.Punch;
            yield new WaitForSeconds(0.2);
            zepetoCharacter.GetComponent<ZepetoGameCharacter>().PunchStart();
            yield new WaitForSeconds(this._punchGesture.length-0.2);
            zepetoCharacter.GetComponent<ZepetoGameCharacter>().PunchStop();
        }
        else if (playerGestureInfo.gestureIndex == MotionIndex.Defense) {
            zepetoCharacter.SetGesture(this._defenseGesture);
            motionState = MotionState.Defense;
            yield new WaitForSeconds(this._defenseGesture.length);
            motionState = MotionState.Idle;
        }
        else if (playerGestureInfo.gestureIndex == MotionIndex.Die) {
            zepetoCharacter.SetGesture(this._dieGesture);            
            motionState = MotionState.Die;
            for(let i=0; i<3; i++) {
                yield new WaitForSeconds(3);
                if(this._onEndFlag) {
                    break;
                }
                else if(i==2)
                    zepetoCharacter.transform.GetChild(0).gameObject.SetActive(false);
            }
        }
        else
            yield new WaitForSeconds(2);
        zepetoCharacter.CancelGesture();
    }


    KillLog(playerKillInfo: PlayerKillInfo) {
        console.log(playerKillInfo.attackerNickname + "Killed " + playerKillInfo.victimNickname);
        let playerGestureInfo: PlayerGestureInfo;
        playerGestureInfo = { sessionId: playerKillInfo.victimSessionId, gestureIndex: MotionIndex.Die};
        this.StartCoroutine(this.GestureSync(playerGestureInfo));
        this._killLogPanel.GetKillLog(playerKillInfo);
    }

    
    ParseVector3(vector3: Vector3): Vector3 {
        return new Vector3
            (
                vector3.x,
                vector3.y,
                vector3.z
            );
    }

}