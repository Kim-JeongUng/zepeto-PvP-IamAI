import { AnimationClip, GameObject, SpriteRenderer, Texture2D, Transform, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { LocalPlayer, SpawnInfo, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { OfficialContentType, WorldService, ZepetoWorldContent, Content, ZepetoWorldMultiplay } from 'ZEPETO.World';

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: number,
}
interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

enum MotionIndex {
    "Punch" = 0,
    "Die"
}
const CancelMotion = -1 as const;

export class GameManager extends ZepetoScriptBehaviour {
    
    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    @SerializeField() private _punchGesture: AnimationClip;

    private _myCharacter: ZepetoCharacter;
    private _punchFlag: boolean;
    private room: Room;

    MESSAGE_TYPE = {
        OnPunchGesture: "OnGestureChange",
        OnHitPlayer: "OnHitPlayer"
    };

    Start() {    
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });

        this._multiplay.RoomCreated += (room: Room) => {
            this.room = room;
            console.log(this.MESSAGE_TYPE.OnPunchGesture);

            //서버로부터 유저의 제스쳐 정보를 받음
            this.room.AddMessageHandler(this.MESSAGE_TYPE.OnPunchGesture, (message: PlayerGestureInfo) => {
                this.GestureSync(message);
            });
            this.room.AddMessageHandler(this.MESSAGE_TYPE.OnHitPlayer, (message: PlayerKillInfo) => {
                // dieGesture
                this.GestureSync(message);

                // kill log
                this.KillLog(message);
            });
        };
    }
    Punch() {
        if (!this._punchFlag) {
            this._punchFlag = true;
            const data = new RoomData();
            data.Add("gestureIndex", MotionIndex.Punch);
            this.room.Send(this.MESSAGE_TYPE.OnPunchGesture, data.GetObject());
        }
    }
    GestureSync(playerGestureInfo: PlayerGestureInfo) {
        if (playerGestureInfo.gestureIndex == MotionIndex.Punch) {
            const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(playerGestureInfo.sessionId);
            zepetoPlayer.character.SetGesture(this._punchGesture);
            this.StartCoroutine(this.DoRoutine(zepetoPlayer));
        }
    }
    KillLog(playerKillInfo: PlayerKillInfo) {

    }

    * DoRoutine(zepetoPlayer: ZepetoPlayer) {
        yield new WaitForSeconds(2);
        zepetoPlayer.character.CancelGesture();
    }
}