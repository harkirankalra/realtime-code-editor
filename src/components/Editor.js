import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);

    // Single useEffect for ALL socket event listeners (easier cleanup)
    useEffect(() => {
        const socket = socketRef.current;
        const editor = editorRef.current;
        
        // This function handles the *application* of code, whether local or sync.
        const applyCodeChange = (code) => {
            if (code !== null && editor) {
                const currentCode = editor.getValue();
                
                if (code !== currentCode) {
                    // Use 'setValue' to prevent re-broadcasting this change
                    editor.setValue(code, 'setValue'); 
                }
            }
        };


        if (socket) {
            // 1. Listen for standard CODE_CHANGE events (remote user typing)
            socket.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                applyCodeChange(code);
            });
            
            // 2. LISTEN FOR SYNC_CODE (INITIAL CODE FOR JOINING USER)
            // The server emits CODE_CHANGE when syncing, so we reuse the handler.
            socket.on(ACTIONS.SYNC_CODE, ({ code }) => {
                applyCodeChange(code);
            });
        }

        // Cleanup: Remove listeners when the component unmounts
        return () => {
            if (socket) {
                socket.off(ACTIONS.CODE_CHANGE);
                socket.off(ACTIONS.SYNC_CODE);
            }
        };
    // Dependencies: Only include the socket reference.
    // The lint warning is disabled because we check socketRef.current inside the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketRef.current]); 


    // Initialization and Local Change Emission (Separated for clarity)
    useEffect(() => {
        async function init() {
            if (editorRef.current) return;

            const textarea = document.getElementById('realtimeEditor');
            if (!textarea) return;

            editorRef.current = Codemirror.fromTextArea(textarea, {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            });

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);

                // Emit code change only if it was a user-generated change
                if (origin !== 'setValue' && socketRef.current) {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    // The dependency array is correct here, as it needs to attach the listener using 
    // these props/refs only once when the component mounts.
    }, [socketRef, roomId, onCodeChange]); 


    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;