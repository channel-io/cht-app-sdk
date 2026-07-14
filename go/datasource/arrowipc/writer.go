package arrowipc

import (
	"bytes"
	"encoding/binary"
	"fmt"

	"github.com/apache/arrow-go/v18/arrow"
	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/apache/arrow-go/v18/arrow/memory"
)

const (
	continuationToken = 0xFFFFFFFF
	metadataAlignment = 8
	messagePrefixSize = 8
)

type ChunkSender interface {
	SendArrowSchema(serializedSchema []byte) error
	SendArrowRecordBatch(serializedRecordBatch []byte) error
}

type Frame struct {
	DataHeader []byte
	DataBody   []byte
}

func SplitMessage(serializedMessage []byte) (Frame, error) {
	if len(serializedMessage) < messagePrefixSize {
		return Frame{}, fmt.Errorf("arrow ipc message too short: %d", len(serializedMessage))
	}
	if got := binary.LittleEndian.Uint32(serializedMessage[0:4]); got != continuationToken {
		return Frame{}, fmt.Errorf("arrow ipc message missing continuation marker")
	}

	metadataLen := int(binary.LittleEndian.Uint32(serializedMessage[4:8]))
	if metadataLen == 0 {
		return Frame{}, fmt.Errorf("arrow ipc end-of-stream marker cannot be sent as a data frame")
	}
	if metadataLen%metadataAlignment != 0 {
		return Frame{}, fmt.Errorf("arrow ipc metadata length is not aligned: %d", metadataLen)
	}

	headerLen := messagePrefixSize + metadataLen
	if headerLen > len(serializedMessage) {
		return Frame{}, fmt.Errorf("arrow ipc message header length exceeds payload: header=%d payload=%d", headerLen, len(serializedMessage))
	}

	return Frame{
		DataHeader: append([]byte(nil), serializedMessage[:headerLen]...),
		DataBody:   append([]byte(nil), serializedMessage[headerLen:]...),
	}, nil
}

func NewWriter(sender ChunkSender, schema *arrow.Schema, opts ...ipc.Option) *ipc.Writer {
	options := append([]ipc.Option{ipc.WithSchema(schema)}, opts...)
	return ipc.NewWriterWithPayloadWriter(&payloadWriter{sender: sender}, options...)
}

type payloadWriter struct {
	sender ChunkSender
}

func (w *payloadWriter) Start() error {
	return nil
}

func (w *payloadWriter) WritePayload(payload ipc.Payload) error {
	if w.sender == nil {
		return fmt.Errorf("arrow ipc sender is required")
	}

	meta := payload.Meta()
	if meta == nil {
		return nil
	}
	defer meta.Release()

	msg := ipc.NewMessage(meta, memory.NewBufferBytes(nil))
	defer msg.Release()

	var encoded bytes.Buffer
	if _, err := payload.WritePayload(&encoded); err != nil {
		return err
	}
	data := append([]byte(nil), encoded.Bytes()...)

	switch msg.Type() {
	case ipc.MessageSchema:
		return w.sender.SendArrowSchema(data)
	case ipc.MessageRecordBatch:
		return w.sender.SendArrowRecordBatch(data)
	case ipc.MessageDictionaryBatch:
		return fmt.Errorf("dictionary encoded Arrow batches are not supported by datasource streaming")
	default:
		return nil
	}
}

func (w *payloadWriter) Close() error {
	return nil
}
