local a = {}
for i=0, 100 do
  a[i] = redis.call('GET','bench_key')
end
return cjson.encode(a)