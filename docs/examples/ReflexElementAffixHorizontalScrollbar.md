### ReflexElement Container Affix

This reproduces the same DOM shape as `ReflexElement > div.overflow-y-auto.overflow-x-hidden > Table`. The affixed horizontal scrollbar should attach to the inner scrolling container, not the outer pane.

<!--start-code-->

```js
const data = mockUsers(20);

const App = () => {
  return (
    <div
      style={{
        height: 660,
        padding: 24,
        background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)'
      }}
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          gap: 16
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid #d1d5db',
            borderRadius: 10,
            background: '#ffffff',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div style={{ padding: 20, minHeight: 760 }}>
            <div style={{ marginBottom: 16, fontWeight: 600, color: '#111827' }}>
              ReflexElement
            </div>

            <div
              style={{
                height: 320,
                overflowY: 'auto',
                overflowX: 'hidden',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#fafafa'
              }}
            >
              <div style={{ height: 160, padding: 16, color: '#6b7280' }}>
                Scroll this inner container
              </div>

              <Table affixHorizontalScrollbar data={data} autoHeight={true}>
                <Column width={100} fixed resizable>
                  <HeaderCell>Id</HeaderCell>
                  <Cell dataKey="id" />
                </Column>

                <Column width={260} resizable>
                  <HeaderCell>First Name</HeaderCell>
                  <Cell dataKey="firstName" />
                </Column>

                <Column width={260} resizable>
                  <HeaderCell>Last Name</HeaderCell>
                  <Cell dataKey="lastName" />
                </Column>

                <Column width={320} resizable>
                  <HeaderCell>City</HeaderCell>
                  <Cell dataKey="city" />
                </Column>

                <Column width={320} resizable>
                  <HeaderCell>Street</HeaderCell>
                  <Cell dataKey="street" />
                </Column>

                <Column width={320}>
                  <HeaderCell>Email</HeaderCell>
                  <Cell dataKey="email" />
                </Column>
              </Table>

              <div style={{ height: 220 }} />
            </div>
          </div>
        </div>

        <div
          style={{
            width: 220,
            borderRadius: 10,
            background: '#111827',
            color: '#f9fafb',
            padding: 20
          }}
        >
          Side Pane
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />);
```

<!--end-code-->
