import { AnimationClip, GameObject, Quaternion, Random, SpriteRenderer, Texture2D, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { Button,Image } from 'UnityEngine.UI';
import { LocalPlayer, SpawnInfo, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import ZepetoGameCharacter from './ZepetoGameCharacter';

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: MotionIndex,
}
interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

enum MotionIndex {
    "Punch" = 0,
    "Defense",
    "Die"
}

export default class GameManager extends ZepetoScriptBehaviour {

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    @SerializeField() private _punchGesture: AnimationClip;
    @SerializeField() private _defenseGesture: AnimationClip;
    @SerializeField() private _dieGesture: AnimationClip;

    private room: Room;
    private _myCharacter: ZepetoCharacter;
    
    private _punchCool: number = 5;
    private _punchFlag: boolean;
    private _punchBtn: Button;
    
    private _defenseCool: number = 5;
    private _defenseFlag: boolean;
    private _defenseBtn: Button;

    private _MESSAGE = {
        OnPlayGesture: "OnPlayGesture",
        OnHitPlayer: "OnHitPlayer"
    };

    Start() {
        this._multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this._punchBtn = GameObject.Find("PunchBtn").GetComponent<Button>() as Button;
            this._punchBtn.onClick.AddListener(() => {
                this.StartCoroutine(this.Punch());
            });
            this._defenseBtn = GameObject.Find("DefenseBtn").GetComponent<Button>() as Button;
            this._defenseBtn.onClick.AddListener(() => {
                this.StartCoroutine(this.Defense());
            });
            //�����κ��� ������ ������ ������ ����
            this.room.AddMessageHandler(this._MESSAGE.OnPlayGesture, (message: PlayerGestureInfo) => {
                this.StartCoroutine(this.GestureSync(message));
            });
            this.room.AddMessageHandler(this._MESSAGE.OnHitPlayer, (message: PlayerKillInfo) => {
                this.KillLog(message);
            });
        });

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
        const data = new RoomData();
        data.Add("attackerSessionId", attacker.name);
        data.Add("victimSessionId", victim.name);
        this.room.Send(this._MESSAGE.OnHitPlayer, data.GetObject());
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
            console.log("ASDASD");
            yield new WaitForSeconds(10);
        }
        else
            yield  new WaitForSeconds(2);
        zepetoPlayer.character.CancelGesture();
    }


    KillLog(playerKillInfo: PlayerKillInfo) {
        console.log(playerKillInfo.attackerSessionId + "Killed " + playerKillInfo.victimSessionId);
        let playerGestureInfo: PlayerGestureInfo;
        playerGestureInfo = { sessionId: playerKillInfo.victimSessionId, gestureIndex: MotionIndex.Die};
        console.log("ASDA@@@");
        this.StartCoroutine(this.GestureSync(playerGestureInfo));
    }

    
    ParseVector3(vector3: Vector3): Vector3 {
        return new Vector3
            (
                vector3.x,
                vector3.y,
                vector3.z
            );
    }

    /*TODO
    - transform���� ���Ǿ��̵� �������¹�
    - ai ����ȭ ��ǥ�� ai �̵�

    BUGS
    - ��ġ �ִϸ��̼� �κ�ũ ����
    - AI�߰��ɶ� �������� �ذ�
    - SetGesture ���� (��� ��� ����)
    */
}