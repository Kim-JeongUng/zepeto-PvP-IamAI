import { AnimationClip, GameObject, Quaternion, Random, SpriteRenderer, Texture2D, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { Button,Image } from 'UnityEngine.UI';
import { LocalPlayer, SpawnInfo, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import ZepetoGameCharacter from './ZepetoGameCharacter';
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

    private _MESSAGE = {
        OnPlayGesture: "OnPlayGesture",
        OnHitPlayer: "OnHitPlayer",
        OnEndGame:"OnEndGame",
    };

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room = ClientStarterV2.instance.room;
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this._punchBtn = GameObject.Find("PunchBtn").GetComponent<Button>() as Button;
            this._punchBtn.onClick.AddListener(() => {
                this.StartCoroutine(this.Punch());
            });
            this._defenseBtn = GameObject.Find("DefenseBtn").GetComponent<Button>() as Button;
            this._defenseBtn.onClick.AddListener(() => {
                this.StartCoroutine(this.Defense());
            });
            this.room.AddMessageHandler(this._MESSAGE.OnPlayGesture, (message: PlayerGestureInfo) => {
                this.StartCoroutine(this.GestureSync(message));
            });
            this.room.AddMessageHandler(this._MESSAGE.OnHitPlayer, (message: PlayerKillInfo) => {
                this.KillLog(message);
            });
            this.room.AddMessageHandler(this._MESSAGE.OnEndGame, (message) => {
                //End Game
            });

        });
        this._killLogPanel = GameObject.Find("KillLogPanel").GetComponent<KillLogPanel>();

    }

    * Punch() {
        if (!this._punchFlag) {
            this._punchFlag = true;
            this.room.Send(this._MESSAGE.OnPlayGesture, MotionIndex.Punch);
            yield new WaitForSeconds(this._punchCool);
            this._punchFlag = false;
        }
    }
    
   * Defense() {
        if (!this._defenseFlag) {
            this._defenseFlag = true;
            this.room.Send(this._MESSAGE.OnPlayGesture, MotionIndex.Defense);
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
            this.room.Send(this._MESSAGE.OnHitPlayer, data.GetObject());
        }
    }

    * GestureSync(playerGestureInfo: PlayerGestureInfo) {
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(playerGestureInfo.sessionId);
        if (playerGestureInfo.gestureIndex == MotionIndex.Punch) {
            zepetoPlayer.character.SetGesture(this._punchGesture);
            yield new WaitForSeconds(2);
        }
        else if (playerGestureInfo.gestureIndex == MotionIndex.Defense) {
            zepetoPlayer.character.SetGesture(this._defenseGesture);
            yield new WaitForSeconds(2);
        }
        else if (playerGestureInfo.gestureIndex == MotionIndex.Die) {
            zepetoPlayer.character.SetGesture(this._dieGesture);
            yield new WaitForSeconds(10);
            zepetoPlayer.character.transform.GetChild(0).gameObject.SetActive(false);
        }
        else
            yield  new WaitForSeconds(2);
        zepetoPlayer.character.CancelGesture();
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